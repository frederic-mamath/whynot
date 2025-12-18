# Phase 2: Backend Implementation

**Status**: To Do  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 1 completed

---

## Objectives

- Implement Agora token generation utility
- Create channel management tRPC router
- Implement channel CRUD operations
- Add channel access control and validation
- Test API endpoints

---

## Tasks

### 2.1 Agora Token Generation Utility

**Location**: `src/utils/agora.ts`

**Implementation**:
```typescript
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const APP_ID = process.env.AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!;

if (!APP_ID || !APP_CERTIFICATE) {
  throw new Error('Agora credentials not configured. Check .env file.');
}

export interface TokenOptions {
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
  expirationTimeInSeconds?: number;
}

/**
 * Generate Agora RTC token for channel access
 * @param options Token generation options
 * @returns Agora RTC token string
 */
export function generateAgoraToken(options: TokenOptions): string {
  const {
    channelName,
    uid,
    role,
    expirationTimeInSeconds = 3600, // Default: 1 hour
  } = options;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Convert role to Agora role
  const agoraRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  // Generate token
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs
  );

  return token;
}

/**
 * Get Agora App ID (safe to expose to client)
 */
export function getAgoraAppId(): string {
  return APP_ID;
}
```

**Key Points**:
- Token expires after 1 hour by default (configurable)
- Host role allows publishing audio/video
- Audience role allows only subscribing
- App Certificate stays on server only

---

### 2.2 Channel Router - Create Channel

**Location**: `src/routers/channel.ts`

**Create Procedure**:
```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { channels, channelParticipants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { generateAgoraToken, getAgoraAppId } from '../utils/agora';

export const channelRouter = router({
  /**
   * Create a new live channel
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, 'Name must be at least 3 characters').max(100),
        maxParticipants: z.number().min(2).max(50).default(10),
        isPrivate: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check authentication
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a channel',
        });
      }

      // Create channel
      const [channel] = await db
        .insert(channels)
        .values({
          name: input.name,
          hostId: ctx.userId,
          maxParticipants: input.maxParticipants,
          isPrivate: input.isPrivate,
        })
        .returning();

      // Add host as first participant
      await db.insert(channelParticipants).values({
        channelId: channel.id,
        userId: ctx.userId,
        role: 'host',
      });

      // Generate Agora token for host
      const token = generateAgoraToken({
        channelName: channel.id.toString(),
        uid: ctx.userId,
        role: 'host',
      });

      return {
        channel,
        token,
        appId: getAgoraAppId(),
      };
    }),
});
```

---

### 2.3 Channel Router - Join Channel

**Join Procedure**:
```typescript
/**
 * Join an existing channel
 */
join: publicProcedure
  .input(
    z.object({
      channelId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check authentication
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to join a channel',
      });
    }

    // Find channel
    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, input.channelId),
    });

    if (!channel) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Channel not found',
      });
    }

    // Check if channel is active
    if (channel.status !== 'active') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This channel has ended',
      });
    }

    // Check participant limit
    const participantCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(channelParticipants)
      .where(
        and(
          eq(channelParticipants.channelId, input.channelId),
          isNull(channelParticipants.leftAt)
        )
      );

    if (participantCount[0].count >= channel.maxParticipants) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Channel is full',
      });
    }

    // Check if user already joined
    const existingParticipant = await db.query.channelParticipants.findFirst({
      where: and(
        eq(channelParticipants.channelId, input.channelId),
        eq(channelParticipants.userId, ctx.userId),
        isNull(channelParticipants.leftAt)
      ),
    });

    if (!existingParticipant) {
      // Add as new participant
      await db.insert(channelParticipants).values({
        channelId: input.channelId,
        userId: ctx.userId,
        role: 'audience',
      });
    }

    // Generate token for audience
    const token = generateAgoraToken({
      channelName: channel.id.toString(),
      uid: ctx.userId,
      role: 'audience',
    });

    return {
      channel,
      token,
      appId: getAgoraAppId(),
    };
  }),
```

---

### 2.4 Channel Router - List Channels

**List Procedure**:
```typescript
import { sql, isNull } from 'drizzle-orm';

/**
 * List all active channels
 */
list: publicProcedure
  .input(
    z.object({
      includePrivate: z.boolean().default(false),
    }).optional()
  )
  .query(async ({ input, ctx }) => {
    const conditions = [eq(channels.status, 'active')];

    // Filter private channels unless requested
    if (!input?.includePrivate) {
      conditions.push(eq(channels.isPrivate, false));
    }

    const channelList = await db
      .select({
        id: channels.id,
        name: channels.name,
        hostId: channels.hostId,
        maxParticipants: channels.maxParticipants,
        isPrivate: channels.isPrivate,
        createdAt: channels.createdAt,
        participantCount: sql<number>`
          (SELECT COUNT(*) 
           FROM ${channelParticipants} 
           WHERE ${channelParticipants.channelId} = ${channels.id} 
           AND ${channelParticipants.leftAt} IS NULL)
        `,
      })
      .from(channels)
      .where(and(...conditions))
      .orderBy(sql`${channels.createdAt} DESC`);

    return channelList;
  }),
```

---

### 2.5 Channel Router - Get Channel Details

**Get Procedure**:
```typescript
/**
 * Get channel details with participants
 */
get: publicProcedure
  .input(
    z.object({
      channelId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, input.channelId),
    });

    if (!channel) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Channel not found',
      });
    }

    // Get active participants
    const participants = await db
      .select()
      .from(channelParticipants)
      .where(
        and(
          eq(channelParticipants.channelId, input.channelId),
          isNull(channelParticipants.leftAt)
        )
      );

    return {
      channel,
      participants,
    };
  }),
```

---

### 2.6 Channel Router - End Channel

**End Procedure**:
```typescript
/**
 * End a channel (host only)
 */
end: publicProcedure
  .input(
    z.object({
      channelId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    const channel = await db.query.channels.findFirst({
      where: eq(channels.id, input.channelId),
    });

    if (!channel) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Channel not found',
      });
    }

    // Check if user is the host
    if (channel.hostId !== ctx.userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the host can end the channel',
      });
    }

    // Update channel status
    await db
      .update(channels)
      .set({
        status: 'ended',
        endedAt: new Date(),
      })
      .where(eq(channels.id, input.channelId));

    // Mark all participants as left
    await db
      .update(channelParticipants)
      .set({
        leftAt: new Date(),
      })
      .where(
        and(
          eq(channelParticipants.channelId, input.channelId),
          isNull(channelParticipants.leftAt)
        )
      );

    return { success: true };
  }),
```

---

### 2.7 Channel Router - Leave Channel

**Leave Procedure**:
```typescript
/**
 * Leave a channel
 */
leave: publicProcedure
  .input(
    z.object({
      channelId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    // Find active participation
    const participant = await db.query.channelParticipants.findFirst({
      where: and(
        eq(channelParticipants.channelId, input.channelId),
        eq(channelParticipants.userId, ctx.userId),
        isNull(channelParticipants.leftAt)
      ),
    });

    if (!participant) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'You are not in this channel',
      });
    }

    // Mark as left
    await db
      .update(channelParticipants)
      .set({
        leftAt: new Date(),
      })
      .where(eq(channelParticipants.id, participant.id));

    return { success: true };
  }),
```

---

### 2.8 Register Channel Router

**Update**: `src/routers/index.ts`

```typescript
import { router } from '../trpc';
import { authRouter } from './auth';
import { channelRouter } from './channel';

export const appRouter = router({
  auth: authRouter,
  channel: channelRouter,
});

export type AppRouter = typeof appRouter;
```

---

## Testing

### Manual Testing with cURL

**Create Channel**:
```bash
curl -X POST http://localhost:3000/trpc/channel.create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Channel",
    "maxParticipants": 10,
    "isPrivate": false
  }'
```

**List Channels**:
```bash
curl http://localhost:3000/trpc/channel.list
```

**Join Channel**:
```bash
curl -X POST http://localhost:3000/trpc/channel.join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"channelId": 1}'
```

---

## Validation Checklist

- [ ] Token generation utility created and working
- [ ] All channel router procedures implemented
- [ ] Authentication checks in place
- [ ] Channel capacity validation works
- [ ] Host-only operations protected
- [ ] Channel router registered in app router
- [ ] API endpoints return correct data structure
- [ ] Error handling works correctly
- [ ] TypeScript types inferred correctly

---

## Success Criteria

- ✅ Channel can be created via API
- ✅ Users can join existing channels
- ✅ Channel list is filterable
- ✅ Only hosts can end channels
- ✅ Tokens are generated correctly
- ✅ All endpoints have proper authentication
- ✅ Participant limits are enforced

---

## Next Phase

➡️ **Phase 3**: Frontend Implementation - UI components and Agora integration

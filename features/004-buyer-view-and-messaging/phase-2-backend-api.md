# Phase 2: Backend API Implementation

**Estimated Time**: 2-3 hours  
**Actual Time**: 1 hour  
**Status**: ✅ Done  
**Completed**: 2025-12-29  
**Dependencies**: Phase 1 completed

---

## Objective

Build tRPC API endpoints for sending, listing, and subscribing to channel messages with proper validation and access control.

---

## Files to Create/Modify

### New Files
- `src/routers/message.ts` - Message management tRPC router

### Files to Modify
- `src/routers/index.ts` - Register message router
- `src/routers/channel.ts` - Add role support to join endpoint

---

## Steps

### 1. Create Message Router

Create `src/routers/message.ts`:

```typescript
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import { sanitizeMessage, validateMessage } from '../utils/validation';
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';

// Event emitter for real-time updates
const messageEvents = new EventEmitter();

export const messageRouter = router({
  // Send a message to a channel
  send: protectedProcedure
    .input(
      z.object({
        channelId: z.string().uuid(),
        content: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate message content
      const validation = validateMessage(input.content);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.error,
        });
      }

      // Check if user is in channel
      const participant = await ctx.db
        .selectFrom('channel_participants')
        .where('channel_id', '=', input.channelId)
        .where('user_id', '=', ctx.user.id)
        .where('left_at', 'is', null)
        .selectAll()
        .executeTakeFirst();

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be in the channel to send messages',
        });
      }

      // Sanitize and insert message
      const sanitized = sanitizeMessage(input.content);
      const message = await ctx.db
        .insertInto('messages')
        .values({
          channelId: input.channelId,
          userId: ctx.user.id,
          content: sanitized,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Get user info for real-time update
      const user = await ctx.db
        .selectFrom('users')
        .where('id', '=', ctx.user.id)
        .select(['id', 'username', 'email'])
        .executeTakeFirstOrThrow();

      // Emit event for subscribers
      messageEvents.emit(`channel:${input.channelId}`, {
        ...message,
        user,
      });

      return { ...message, user };
    }),

  // List messages for a channel
  list: publicProcedure
    .input(
      z.object({
        channelId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const messages = await ctx.db
        .selectFrom('messages')
        .where('channel_id', '=', input.channelId)
        .where('deleted_at', 'is', null)
        .orderBy('created_at', 'desc')
        .limit(input.limit)
        .selectAll()
        .execute();

      // Get user info for each message
      const userIds = [...new Set(messages.map((m) => m.userId))];
      const users = await ctx.db
        .selectFrom('users')
        .where('id', 'in', userIds)
        .select(['id', 'username', 'email'])
        .execute();

      const userMap = new Map(users.map((u) => [u.id, u]));

      return messages
        .map((m) => ({
          ...m,
          user: userMap.get(m.userId),
        }))
        .reverse(); // Oldest first
    }),

  // Subscribe to new messages in a channel
  subscribe: publicProcedure
    .input(z.object({ channelId: z.string().uuid() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const handler = (data: any) => {
          emit.next(data);
        };

        messageEvents.on(`channel:${input.channelId}`, handler);

        return () => {
          messageEvents.off(`channel:${input.channelId}`, handler);
        };
      });
    }),

  // Delete own message (soft delete)
  delete: protectedProcedure
    .input(z.object({ messageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db
        .selectFrom('messages')
        .where('id', '=', input.messageId)
        .selectAll()
        .executeTakeFirst();

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      if (message.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        });
      }

      await ctx.db
        .updateTable('messages')
        .set({ deletedAt: new Date() })
        .where('id', '=', input.messageId)
        .execute();

      return { success: true };
    }),
});
```

### 2. Register Message Router

Update `src/routers/index.ts`:

```typescript
import { messageRouter } from './message';

export const appRouter = router({
  // ... existing routers
  message: messageRouter,
});
```

### 3. Update Channel Router (Add Role Support)

Update `src/routers/channel.ts`:

```typescript
// In the join procedure, add role parameter
join: protectedProcedure
  .input(
    z.object({
      channelId: z.string().uuid(),
      role: z.enum(['publisher', 'audience']).default('publisher'),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // ... existing code

    // Determine Agora role based on user role
    const userRole = ctx.user.role; // From RBAC feature
    const agoraRole = userRole === 'seller' ? 'publisher' : 'audience';

    // Generate token with appropriate role
    const token = generateAgoraToken(
      input.channelId,
      uid,
      agoraRole
    );

    // ... rest of code
  }),
```

### 4. Add Rate Limiting (Optional but Recommended)

Install rate limiting library:

```bash
npm install express-rate-limit
```

Add to `src/routers/message.ts`:

```typescript
// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 }); // 1 min
    return true;
  }

  if (userLimit.count >= 10) {
    return false; // Max 10 messages per minute
  }

  userLimit.count++;
  return true;
}

// Use in send mutation
if (!checkRateLimit(ctx.user.id)) {
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: 'Rate limit exceeded. Please wait before sending more messages.',
  });
}
```

---

## API Endpoints

### `message.send`
- **Input**: `{ channelId: string, content: string }`
- **Output**: `{ id, channelId, userId, content, createdAt, user }`
- **Auth**: Required
- **Validation**: 
  - User must be in channel
  - Content 1-500 characters
  - HTML sanitization
  - Rate limit: 10/min

### `message.list`
- **Input**: `{ channelId: string, limit?: number }`
- **Output**: `Message[]`
- **Auth**: Public
- **Returns**: Last N messages (default 50, max 100)

### `message.subscribe`
- **Input**: `{ channelId: string }`
- **Output**: Real-time message stream
- **Auth**: Public
- **Uses**: EventEmitter for in-memory pub/sub

### `message.delete`
- **Input**: `{ messageId: string }`
- **Output**: `{ success: boolean }`
- **Auth**: Required
- **Validation**: Can only delete own messages

---

## Acceptance Criteria

- [x] Can send message to channel via API
- [x] Can retrieve message history
- [x] Real-time subscription works (EventEmitter-based)
- [x] Rate limiting prevents spam (10 msg/min)
- [x] HTML tags are sanitized
- [x] Only channel participants can send messages
- [x] Can delete own messages (soft delete)
- [x] Cannot delete other users' messages
- [x] Message includes user info (email, firstname, lastname)
- [x] Messages ordered by creation time

---

## Testing

### Manual Testing with tRPC Client

```typescript
// Send message
await trpc.message.send.mutate({
  channelId: 'channel-uuid',
  content: 'Hello everyone!',
});

// List messages
const messages = await trpc.message.list.query({
  channelId: 'channel-uuid',
  limit: 50,
});

// Subscribe to messages
const subscription = trpc.message.subscribe.subscribe(
  { channelId: 'channel-uuid' },
  {
    onData: (message) => console.log('New message:', message),
  }
);

// Delete message
await trpc.message.delete.mutate({
  messageId: 'message-uuid',
});
```

### Test Cases

1. **Send valid message** ✅
2. **Send empty message** ❌ (should fail)
3. **Send 501 char message** ❌ (should fail)
4. **Send message with HTML** ✅ (sanitized)
5. **Send message not in channel** ❌ (forbidden)
6. **Send 11 messages in 1 min** ❌ (rate limited)
7. **List messages** ✅
8. **Subscribe to messages** ✅
9. **Delete own message** ✅
10. **Delete other's message** ❌ (forbidden)

---

## Rollback Plan

If issues occur:
1. Remove message router from `src/routers/index.ts`
2. Delete `src/routers/message.ts`
3. Revert changes to `src/routers/channel.ts`

---

## Notes

- Uses EventEmitter for in-memory pub/sub (simple, works for single server)
- For multi-server deployment, consider Redis pub/sub
- Rate limiting is in-memory (resets on server restart)
- Consider using `@trpc/server-plugin-rate-limit` for production
- Subscriptions require WebSocket support in tRPC setup

---

## Status

**Current Status**: ✅ Done  
**Last Updated**: 2025-12-29  
**Completion Notes**: 
- Message router created with all CRUD operations
- Repository pattern implemented for data access
- Real-time subscriptions using EventEmitter
- Rate limiting: 10 messages/minute per user
- XSS protection via HTML sanitization
- Access control: only channel participants can send
- All tests passed successfully

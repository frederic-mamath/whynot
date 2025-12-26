# Phase 5: Channel & Participant Repositories

## Objective
Create ChannelRepository and ChannelParticipantRepository to handle all channel-related database operations, then refactor the channel router.

## Current State Analysis

The `channel.ts` router handles:
1. Create channel
2. List channels (active, by host, all)
3. Get channel details
4. End channel
5. Join channel (add participant)
6. Leave channel (remove participant)
7. Get participants list
8. Get channel statistics

Mix of channel management and participant management.

## Repositories to Create

### 1. `src/repositories/ChannelRepository.ts`

```typescript
import { BaseRepository } from './base/BaseRepository';
import { ChannelsTable, Channel } from '../db/types';
import { db } from '../db';

/**
 * Repository for Channel entity
 * Handles all channel-related database operations
 */
export class ChannelRepository extends BaseRepository<ChannelsTable, 'channels'> {
  constructor() {
    super('channels');
  }

  /**
   * Create new channel
   */
  async createChannel(data: {
    name: string;
    host_id: number;
    max_participants?: number | null;
    is_private?: boolean | null;
  }): Promise<Channel> {
    return db
      .insertInto('channels')
      .values({
        ...data,
        status: 'active',
        created_at: new Date(),
        ended_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Find all active channels
   */
  async findActive(): Promise<Channel[]> {
    return db
      .selectFrom('channels')
      .selectAll()
      .where('status', '=', 'active')
      .orderBy('created_at', 'desc')
      .execute();
  }

  /**
   * Find active public channels
   */
  async findActivePublic(): Promise<Channel[]> {
    return db
      .selectFrom('channels')
      .selectAll()
      .where('status', '=', 'active')
      .where((eb) => eb.or([
        eb('is_private', '=', false),
        eb('is_private', 'is', null)
      ]))
      .orderBy('created_at', 'desc')
      .execute();
  }

  /**
   * Find channels by host user
   * @param hostId Host user ID
   * @param activeOnly Only return active channels
   */
  async findByHost(hostId: number, activeOnly = true): Promise<Channel[]> {
    let query = db
      .selectFrom('channels')
      .selectAll()
      .where('host_id', '=', hostId)
      .orderBy('created_at', 'desc');
    
    if (activeOnly) {
      query = query.where('status', '=', 'active');
    }
    
    return query.execute();
  }

  /**
   * End channel (mark as ended)
   * @param channelId Channel ID
   */
  async endChannel(channelId: number): Promise<Channel | undefined> {
    return db
      .updateTable('channels')
      .set({
        status: 'ended',
        ended_at: new Date(),
      })
      .where('id', '=', channelId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Check if channel is active
   * @param channelId Channel ID
   */
  async isActive(channelId: number): Promise<boolean> {
    const channel = await db
      .selectFrom('channels')
      .select(['status'])
      .where('id', '=', channelId)
      .executeTakeFirst();
    
    return channel?.status === 'active';
  }

  /**
   * Check if user is channel host
   * @param channelId Channel ID
   * @param userId User ID
   */
  async isHost(channelId: number, userId: number): Promise<boolean> {
    const channel = await db
      .selectFrom('channels')
      .select(['host_id'])
      .where('id', '=', channelId)
      .executeTakeFirst();
    
    return channel?.host_id === userId;
  }

  /**
   * Get channel with participant count
   * @param channelId Channel ID
   */
  async getWithParticipantCount(channelId: number) {
    return db
      .selectFrom('channels')
      .leftJoin('channel_participants', (join) =>
        join
          .onRef('channel_participants.channel_id', '=', 'channels.id')
          .on('channel_participants.left_at', 'is', null)
      )
      .select([
        'channels.id',
        'channels.name',
        'channels.host_id',
        'channels.status',
        'channels.max_participants',
        'channels.is_private',
        'channels.created_at',
        'channels.ended_at',
        (eb) => eb.fn.count('channel_participants.id').as('participant_count')
      ])
      .where('channels.id', '=', channelId)
      .groupBy('channels.id')
      .executeTakeFirst();
  }

  /**
   * Get all channels with participant counts
   */
  async getAllWithParticipantCounts() {
    return db
      .selectFrom('channels')
      .leftJoin('channel_participants', (join) =>
        join
          .onRef('channel_participants.channel_id', '=', 'channels.id')
          .on('channel_participants.left_at', 'is', null)
      )
      .select([
        'channels.id',
        'channels.name',
        'channels.host_id',
        'channels.status',
        'channels.max_participants',
        'channels.is_private',
        'channels.created_at',
        'channels.ended_at',
        (eb) => eb.fn.count('channel_participants.id').as('participant_count')
      ])
      .where('channels.status', '=', 'active')
      .groupBy('channels.id')
      .orderBy('channels.created_at', 'desc')
      .execute();
  }

  /**
   * Check if channel has reached max participants
   * @param channelId Channel ID
   */
  async isAtMaxCapacity(channelId: number): Promise<boolean> {
    const channel = await this.getWithParticipantCount(channelId);
    
    if (!channel || !channel.max_participants) {
      return false;
    }
    
    return Number(channel.participant_count) >= channel.max_participants;
  }
}

// Export singleton instance
export const channelRepository = new ChannelRepository();
```

### 2. `src/repositories/ChannelParticipantRepository.ts`

```typescript
import { db } from '../db';
import { ChannelParticipant } from '../db/types';

/**
 * Repository for ChannelParticipant entity
 * Handles channel participant management
 */
export class ChannelParticipantRepository {
  /**
   * Add participant to channel
   * @param channelId Channel ID
   * @param userId User ID
   * @param role Participant role (host, participant, vendor)
   */
  async addParticipant(
    channelId: number,
    userId: number,
    role: string = 'participant'
  ): Promise<ChannelParticipant> {
    return db
      .insertInto('channel_participants')
      .values({
        channel_id: channelId,
        user_id: userId,
        role,
        joined_at: new Date(),
        left_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Remove participant from channel (mark as left)
   * @param channelId Channel ID
   * @param userId User ID
   */
  async removeParticipant(channelId: number, userId: number): Promise<boolean> {
    const result = await db
      .updateTable('channel_participants')
      .set({ left_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('user_id', '=', userId)
      .where('left_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numChangedRows) > 0;
  }

  /**
   * Get active participants in channel
   * @param channelId Channel ID
   */
  async getActiveParticipants(channelId: number): Promise<ChannelParticipant[]> {
    return db
      .selectFrom('channel_participants')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('left_at', 'is', null)
      .orderBy('joined_at', 'asc')
      .execute();
  }

  /**
   * Get active participants with user information
   * @param channelId Channel ID
   */
  async getActiveParticipantsWithUserInfo(channelId: number) {
    return db
      .selectFrom('channel_participants')
      .innerJoin('users', 'users.id', 'channel_participants.user_id')
      .select([
        'channel_participants.id',
        'channel_participants.channel_id',
        'channel_participants.user_id',
        'channel_participants.role',
        'channel_participants.joined_at',
        'users.email',
        'users.firstname',
        'users.lastname',
      ])
      .where('channel_participants.channel_id', '=', channelId)
      .where('channel_participants.left_at', 'is', null)
      .orderBy('channel_participants.joined_at', 'asc')
      .execute();
  }

  /**
   * Check if user is active participant
   * @param channelId Channel ID
   * @param userId User ID
   */
  async isActiveParticipant(channelId: number, userId: number): Promise<boolean> {
    const participant = await db
      .selectFrom('channel_participants')
      .select(['id'])
      .where('channel_id', '=', channelId)
      .where('user_id', '=', userId)
      .where('left_at', 'is', null)
      .executeTakeFirst();
    
    return participant !== undefined;
  }

  /**
   * Get participant count for channel
   * @param channelId Channel ID
   */
  async getParticipantCount(channelId: number): Promise<number> {
    const result = await db
      .selectFrom('channel_participants')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('channel_id', '=', channelId)
      .where('left_at', 'is', null)
      .executeTakeFirstOrThrow();
    
    return Number(result.count);
  }

  /**
   * Remove all participants from channel (when channel ends)
   * @param channelId Channel ID
   */
  async removeAllParticipants(channelId: number): Promise<number> {
    const result = await db
      .updateTable('channel_participants')
      .set({ left_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('left_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numChangedRows);
  }

  /**
   * Get participant history (all participants, including those who left)
   * @param channelId Channel ID
   */
  async getParticipantHistory(channelId: number): Promise<ChannelParticipant[]> {
    return db
      .selectFrom('channel_participants')
      .selectAll()
      .where('channel_id', '=', channelId)
      .orderBy('joined_at', 'asc')
      .execute();
  }
}

// Export singleton instance
export const channelParticipantRepository = new ChannelParticipantRepository();
```

## Router Refactoring

### Before (channel.ts - current):
```typescript
create: protectedProcedure
  .input(z.object({ name: z.string(), maxParticipants: z.number().optional() }))
  .mutation(async ({ ctx, input }) => {
    const channel = await db
      .insertInto('channels')
      .values({
        name: input.name,
        host_id: ctx.user.id,
        status: 'active',
        max_participants: input.maxParticipants ?? null,
        is_private: false,
        created_at: new Date(),
        ended_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Add host as participant
    await db
      .insertInto('channel_participants')
      .values({
        channel_id: channel.id,
        user_id: ctx.user.id,
        role: 'host',
        joined_at: new Date(),
        left_at: null,
      })
      .execute();

    return channel;
  }),
```

### After (with repositories):
```typescript
import { channelRepository, channelParticipantRepository } from '../repositories';

create: protectedProcedure
  .input(z.object({ name: z.string(), maxParticipants: z.number().optional() }))
  .mutation(async ({ ctx, input }) => {
    // Create channel
    const channel = await channelRepository.createChannel({
      name: input.name,
      host_id: ctx.user.id,
      max_participants: input.maxParticipants ?? null,
      is_private: false,
    });

    // Add host as participant
    await channelParticipantRepository.addParticipant(
      channel.id,
      ctx.user.id,
      'host'
    );

    return channel;
  }),
```

## Implementation Steps

### Step 1: Create ChannelRepository
```bash
touch src/repositories/ChannelRepository.ts
```

### Step 2: Create ChannelParticipantRepository
```bash
touch src/repositories/ChannelParticipantRepository.ts
```

### Step 3: Export Repositories
Update `src/repositories/index.ts`:
```typescript
export { channelRepository } from './ChannelRepository';
export { channelParticipantRepository } from './ChannelParticipantRepository';
```

### Step 4: Refactor channel.ts Router
- Import both repositories
- Replace channel CRUD operations
- Replace participant management
- Replace complex joins with repository methods

### Step 5: Test All Channel Operations
- Create channel
- List channels (various filters)
- Get channel details
- End channel
- Join channel
- Leave channel
- Get participants
- Check capacity limits

## Files to Modify

### New Files:
- `src/repositories/ChannelRepository.ts`
- `src/repositories/ChannelParticipantRepository.ts`

### Modified Files:
- `src/repositories/index.ts` - Add exports
- `src/routers/channel.ts` - Replace database calls

## Benefits

### Separation of Concerns:
- **Channel lifecycle**: Create, list, end
- **Participant management**: Join, leave, list
- Each repository has clear responsibility

### Complex Queries Simplified:
```typescript
// Before: 20+ lines of complex join
const channelsWithCounts = await db
  .selectFrom('channels')
  .leftJoin(...)
  .select([...many fields...])
  .groupBy(...)
  .execute();

// After: One line!
const channelsWithCounts = await channelRepository.getAllWithParticipantCounts();
```

## Validation Checklist

- [ ] ChannelRepository created
- [ ] ChannelParticipantRepository created
- [ ] Both exported from index.ts
- [ ] channel.ts refactored
- [ ] Create channel works
- [ ] List channels works
- [ ] Get channel details works
- [ ] End channel works
- [ ] Join channel works
- [ ] Leave channel works
- [ ] Get participants works
- [ ] Capacity checks work
- [ ] Server builds without errors

## Acceptance Criteria

- ✅ All channel operations in ChannelRepository
- ✅ All participant operations in ChannelParticipantRepository
- ✅ channel.ts uses repositories exclusively
- ✅ No database queries in channel router
- ✅ Complex queries encapsulated
- ✅ All channel functionality works as before

## Estimated Time
**2.5 hours**

## Status
⏳ **PENDING** (Requires Phase 4 completion)

## Notes
- Channel and Participant repositories work closely together
- Good example of related but separate concerns
- Participant count logic is complex - test thoroughly
- Capacity checks are important for UX

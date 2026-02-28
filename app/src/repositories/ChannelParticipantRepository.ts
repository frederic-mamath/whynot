import { db } from '../db';
import { Selectable } from 'kysely';
import { ChannelParticipantsTable } from '../db/types';

type ChannelParticipant = Selectable<ChannelParticipantsTable>;

/**
 * ChannelParticipantRepository - Spring Data JPA style
 * Handles channel participant management
 */
export class ChannelParticipantRepository {
  
  /**
   * Add participant to channel
   * Similar to: INSERT INTO channel_participants (channel_id, user_id, role, joined_at) 
   *             VALUES (?, ?, ?, NOW())
   */
  async addParticipant(
    channelId: number,
    userId: number,
    role: 'host' | 'viewer' | 'vendor'
  ): Promise<ChannelParticipant> {
    return db
      .insertInto('channel_participants')
      .values({
        channel_id: channelId,
        user_id: userId,
        role,
        joined_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Remove participant from channel (set left_at timestamp)
   * Similar to: UPDATE channel_participants SET left_at = NOW() 
   *             WHERE channel_id = ? AND user_id = ? AND left_at IS NULL
   */
  async removeParticipant(channelId: number, userId: number): Promise<boolean> {
    const result = await db
      .updateTable('channel_participants')
      .set({ left_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('user_id', '=', userId)
      .where('left_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Get all active participants in a channel
   * Similar to: SELECT * FROM channel_participants 
   *             WHERE channel_id = ? AND left_at IS NULL
   */
  async getActiveParticipants(channelId: number): Promise<ChannelParticipant[]> {
    return db
      .selectFrom('channel_participants')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('left_at', 'is', null)
      .execute();
  }

  /**
   * Get participant's role in channel
   * Similar to: SELECT role FROM channel_participants 
   *             WHERE channel_id = ? AND user_id = ? AND left_at IS NULL
   */
  async getParticipantRole(
    channelId: number,
    userId: number
  ): Promise<string | undefined> {
    const participant = await db
      .selectFrom('channel_participants')
      .select(['role'])
      .where('channel_id', '=', channelId)
      .where('user_id', '=', userId)
      .where('left_at', 'is', null)
      .executeTakeFirst();
    
    return participant?.role;
  }

  /**
   * Check if user is an active participant in channel
   * Similar to: SELECT EXISTS(SELECT 1 FROM channel_participants 
   *             WHERE channel_id = ? AND user_id = ? AND left_at IS NULL)
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
   * Check if user has ever been a participant (active or past)
   * Similar to: SELECT EXISTS(SELECT 1 FROM channel_participants 
   *             WHERE channel_id = ? AND user_id = ?)
   */
  async hasEverParticipated(channelId: number, userId: number): Promise<boolean> {
    const participant = await db
      .selectFrom('channel_participants')
      .select(['id'])
      .where('channel_id', '=', channelId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    
    return participant !== undefined;
  }

  /**
   * Remove all participants from channel (when channel ends)
   * Similar to: UPDATE channel_participants SET left_at = NOW() 
   *             WHERE channel_id = ? AND left_at IS NULL
   */
  async removeAllParticipants(channelId: number): Promise<number> {
    const result = await db
      .updateTable('channel_participants')
      .set({ left_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('left_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numUpdatedRows);
  }

  /**
   * Count active participants
   * Similar to: SELECT COUNT(*) FROM channel_participants 
   *             WHERE channel_id = ? AND left_at IS NULL
   */
  async countActive(channelId: number): Promise<number> {
    const result = await db
      .selectFrom('channel_participants')
      .select(db.fn.countAll<number>().as('count'))
      .where('channel_id', '=', channelId)
      .where('left_at', 'is', null)
      .executeTakeFirstOrThrow();
    
    return Number(result.count);
  }
}

// Export singleton instance
export const channelParticipantRepository = new ChannelParticipantRepository();

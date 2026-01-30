import { db } from "../db";
import { Selectable } from "kysely";
import { ChannelsTable } from "../db/types";

type Channel = Selectable<ChannelsTable>;

/**
 * ChannelRepository - Spring Data JPA style
 * Handles all channel-related database operations
 */
export class ChannelRepository {
  /**
   * Find channel by ID
   * Similar to: SELECT * FROM channels WHERE id = ?
   */
  async findById(id: number): Promise<Channel | undefined> {
    return db
      .selectFrom("channels")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  /**
   * Find all active channels
   * Similar to: SELECT * FROM channels WHERE status = 'active' ORDER BY created_at DESC
   */
  async findActive(): Promise<Channel[]> {
    return db
      .selectFrom("channels")
      .selectAll()
      .where("status", "=", "active")
      .orderBy("created_at", "desc")
      .execute();
  }

  /**
   * Find channels by host
   * Similar to: SELECT * FROM channels WHERE host_id = ? ORDER BY created_at DESC
   */
  async findByHost(hostId: number): Promise<Channel[]> {
    return db
      .selectFrom("channels")
      .selectAll()
      .where("host_id", "=", hostId)
      .orderBy("created_at", "desc")
      .execute();
  }

  /**
   * Create new channel
   * Similar to: INSERT INTO channels (name, host_id, max_participants, is_private, status, created_at)
   *             VALUES (?, ?, ?, ?, 'active', NOW())
   */
  async save(data: {
    name: string;
    host_id: number;
    max_participants: number | null;
    is_private: boolean | null;
  }): Promise<Channel> {
    return db
      .insertInto("channels")
      .values({
        ...data,
        status: "active",
        is_active: true,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * End a channel (update status to ended and set ended_at)
   * Similar to: UPDATE channels SET status = 'ended', ended_at = NOW() WHERE id = ?
   */
  async endChannel(channelId: number): Promise<Channel | undefined> {
    return db
      .updateTable("channels")
      .set({
        status: "ended",
        ended_at: new Date(),
      })
      .where("id", "=", channelId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Check if channel is active
   * Similar to: SELECT EXISTS(SELECT 1 FROM channels WHERE id = ? AND status = 'active')
   */
  async isActive(channelId: number): Promise<boolean> {
    const channel = await db
      .selectFrom("channels")
      .select(["status"])
      .where("id", "=", channelId)
      .where("status", "=", "active")
      .executeTakeFirst();

    return channel !== undefined;
  }

  /**
   * Get channel status
   * Similar to: SELECT status FROM channels WHERE id = ?
   */
  async getStatus(channelId: number): Promise<string | undefined> {
    const result = await db
      .selectFrom("channels")
      .select(["status"])
      .where("id", "=", channelId)
      .executeTakeFirst();

    return result?.status;
  }

  /**
   * Check if user is the host of the channel
   * Similar to: SELECT EXISTS(SELECT 1 FROM channels WHERE id = ? AND host_id = ?)
   */
  async isHost(channelId: number, userId: number): Promise<boolean> {
    const channel = await db
      .selectFrom("channels")
      .select(["id"])
      .where("id", "=", channelId)
      .where("host_id", "=", userId)
      .executeTakeFirst();

    return channel !== undefined;
  }

  /**
   * Count active participants in channel
   * Similar to: SELECT COUNT(*) FROM channel_participants
   *             WHERE channel_id = ? AND left_at IS NULL
   */
  async countActiveParticipants(channelId: number): Promise<number> {
    const result = await db
      .selectFrom("channel_participants")
      .select(db.fn.countAll<number>().as("count"))
      .where("channel_id", "=", channelId)
      .where("left_at", "is", null)
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  /**
   * Check if channel has reached capacity
   */
  async hasReachedCapacity(channelId: number): Promise<boolean> {
    const channel = await this.findById(channelId);
    if (!channel || !channel.max_participants) {
      return false;
    }

    const activeCount = await this.countActiveParticipants(channelId);
    return activeCount >= channel.max_participants;
  }
}

// Export singleton instance
export const channelRepository = new ChannelRepository();

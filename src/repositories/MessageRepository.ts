import { db } from '../db';
import { Selectable, Insertable } from 'kysely';
import { MessagesTable } from '../db/types';

type Message = Selectable<MessagesTable>;
type NewMessage = Insertable<MessagesTable>;

/**
 * MessageRepository - Spring Data JPA style
 * Handles message management for channels
 */
export class MessageRepository {
  
  /**
   * Save a new message to a channel
   * Similar to: INSERT INTO messages (channel_id, user_id, content, created_at) 
   *             VALUES (?, ?, ?, NOW())
   */
  async save(message: NewMessage): Promise<Message> {
    return db
      .insertInto('messages')
      .values({
        channel_id: message.channel_id,
        user_id: message.user_id,
        content: message.content,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Find messages by channel ID (non-deleted only)
   * Similar to: SELECT * FROM messages 
   *             WHERE channel_id = ? AND deleted_at IS NULL 
   *             ORDER BY created_at DESC 
   *             LIMIT ?
   */
  async findByChannelId(channelId: number, limit: number = 50): Promise<Message[]> {
    return db
      .selectFrom('messages')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute();
  }

  /**
   * Find message by ID
   * Similar to: SELECT * FROM messages WHERE id = ?
   */
  async findById(id: number): Promise<Message | undefined> {
    return db
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Soft delete a message
   * Similar to: UPDATE messages SET deleted_at = NOW() WHERE id = ?
   */
  async softDelete(id: number): Promise<boolean> {
    const result = await db
      .updateTable('messages')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Count messages in a channel (non-deleted only)
   * Similar to: SELECT COUNT(*) FROM messages 
   *             WHERE channel_id = ? AND deleted_at IS NULL
   */
  async countByChannelId(channelId: number): Promise<number> {
    const result = await db
      .selectFrom('messages')
      .select(db.fn.countAll<number>().as('count'))
      .where('channel_id', '=', channelId)
      .where('deleted_at', 'is', null)
      .executeTakeFirstOrThrow();
    
    return Number(result.count);
  }

  /**
   * Get messages with user information
   * Similar to: SELECT m.*, u.id, u.email, u.firstname, u.lastname 
   *             FROM messages m 
   *             JOIN users u ON m.user_id = u.id 
   *             WHERE m.channel_id = ? AND m.deleted_at IS NULL 
   *             ORDER BY m.created_at DESC 
   *             LIMIT ?
   */
  async findByChannelIdWithUsers(channelId: number, limit: number = 50) {
    return db
      .selectFrom('messages')
      .innerJoin('users', 'users.id', 'messages.user_id')
      .select([
        'messages.id',
        'messages.channel_id',
        'messages.user_id',
        'messages.content',
        'messages.created_at',
        'messages.deleted_at',
        'users.id as user_id',
        'users.email as user_email',
        'users.firstname as user_firstname',
        'users.lastname as user_lastname',
      ])
      .where('messages.channel_id', '=', channelId)
      .where('messages.deleted_at', 'is', null)
      .orderBy('messages.created_at', 'desc')
      .limit(limit)
      .execute();
  }
}

// Export singleton instance
export const messageRepository = new MessageRepository();

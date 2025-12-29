import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { messageRepository, channelParticipantRepository } from '../repositories';
import { validateMessage, sanitizeMessage } from '../utils/validation';
import { EventEmitter } from 'events';
import { observable } from '@trpc/server/observable';

// Event emitter for real-time message updates
const messageEvents = new EventEmitter();

// Simple in-memory rate limiter
const rateLimitMap = new Map<number, { count: number; resetAt: number }>();

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }

  if (userLimit.count >= 10) {
    return false; // Max 10 messages per minute
  }

  userLimit.count++;
  return true;
}

export const messageRouter = router({
  /**
   * Send a message to a channel
   */
  send: protectedProcedure
    .input(
      z.object({
        channelId: z.number().int().positive(),
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

      // Check if user is an active participant in the channel
      const isParticipant = await channelParticipantRepository.isActiveParticipant(
        input.channelId,
        ctx.user.id
      );

      if (!isParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be in the channel to send messages',
        });
      }

      // Check rate limit
      if (!checkRateLimit(ctx.user.id)) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please wait before sending more messages.',
        });
      }

      // Sanitize and save message
      const sanitized = sanitizeMessage(input.content);
      const message = await messageRepository.save({
        channel_id: input.channelId,
        user_id: ctx.user.id,
        content: sanitized,
      });

      // Prepare message with user info for real-time update
      const messageWithUser = {
        id: message.id,
        channelId: message.channel_id,
        userId: message.user_id,
        content: message.content,
        createdAt: message.created_at,
        user: {
          id: ctx.user.id,
          email: ctx.user.email,
        },
      };

      // Emit event for subscribers
      messageEvents.emit(`channel:${input.channelId}`, messageWithUser);

      return messageWithUser;
    }),

  /**
   * List messages for a channel
   */
  list: publicProcedure
    .input(
      z.object({
        channelId: z.number().int().positive(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      // Get messages with user information
      const messages = await messageRepository.findByChannelIdWithUsers(
        input.channelId,
        input.limit
      );

      // Transform to match expected format
      return messages.map((m) => ({
        id: m.id,
        channelId: m.channel_id,
        userId: m.user_id,
        content: m.content,
        createdAt: m.created_at,
        user: {
          id: m.user_id,
          email: m.user_email,
          firstname: m.user_firstname,
          lastname: m.user_lastname,
        },
      })).reverse(); // Oldest first
    }),

  /**
   * Subscribe to new messages in a channel (real-time)
   */
  subscribe: publicProcedure
    .input(z.object({ channelId: z.number().int().positive() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const eventName = `channel:${input.channelId}`;
        
        const handler = (data: any) => {
          emit.next(data);
        };

        messageEvents.on(eventName, handler);

        // Cleanup on unsubscribe
        return () => {
          messageEvents.off(eventName, handler);
        };
      });
    }),

  /**
   * Delete own message (soft delete)
   */
  delete: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Check if message exists
      const message = await messageRepository.findById(input.messageId);

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      // Check if user owns the message
      if (message.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        });
      }

      // Soft delete the message
      const deleted = await messageRepository.softDelete(input.messageId);

      if (!deleted) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message already deleted',
        });
      }

      return { success: true };
    }),

  /**
   * Get message count for a channel
   */
  count: publicProcedure
    .input(z.object({ channelId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const count = await messageRepository.countByChannelId(input.channelId);
      return { count };
    }),
});

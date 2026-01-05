import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { channelRepository, channelParticipantRepository, shopRepository } from '../repositories';
import { TRPCError } from '@trpc/server';
import { generateAgoraToken, getAgoraAppId } from '../utils/agora';
import { sql } from 'kysely';
import { db } from '../db';

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

      // Check if user has at least one shop
      const userShops = await shopRepository.findByOwnerId(ctx.userId);
      if (userShops.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must have at least one shop to create a channel',
        });
      }

      // Create channel using repository
      const channel = await channelRepository.save({
        name: input.name,
        host_id: ctx.userId,
        max_participants: input.maxParticipants,
        is_private: input.isPrivate,
      });

      // Add host as first participant
      await channelParticipantRepository.addParticipant(
        channel.id,
        ctx.userId,
        'host'
      );

      // Generate Agora token for host
      // Generate a dynamic UID to avoid conflicts when same user opens multiple tabs
      // Use userId as base + random component to ensure uniqueness
      const dynamicUid = ctx.userId * 10000 + Math.floor(Math.random() * 9999);
      
      const token = generateAgoraToken({
        channelName: channel.id.toString(),
        uid: dynamicUid,
        role: 'host',
      });

      return {
        channel,
        token,
        appId: getAgoraAppId(),
        uid: dynamicUid,
      };
    }),

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
      const channel = await channelRepository.findById(input.channelId);

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
      const hasReachedCapacity = await channelRepository.hasReachedCapacity(input.channelId);
      
      if (hasReachedCapacity) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Channel is full',
        });
      }

      // Check if user already joined
      const alreadyJoined = await channelParticipantRepository.isActiveParticipant(
        input.channelId,
        ctx.userId
      );

      if (!alreadyJoined) {
        // Add as new participant
        await channelParticipantRepository.addParticipant(
          input.channelId,
          ctx.userId,
          'viewer'
        );
      }

      // Generate token for audience
      // Generate a dynamic UID to avoid conflicts when same user opens multiple tabs
      const dynamicUid = ctx.userId * 10000 + Math.floor(Math.random() * 9999);
      
      const token = generateAgoraToken({
        channelName: channel.id.toString(),
        uid: dynamicUid,
        role: 'audience',
      });

      return {
        channel,
        token,
        appId: getAgoraAppId(),
        uid: dynamicUid,
      };
    }),

  /**
   * List all active channels
   */
  list: publicProcedure
    .input(
      z
        .object({
          includePrivate: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ input }) => {
      // Note: This query is complex with subquery, keeping direct db access for now
      // Could be refactored to repository if needed
      let query = db
        .selectFrom('channels')
        .select([
          'channels.id',
          'channels.name',
          'channels.host_id',
          'channels.max_participants',
          'channels.is_private',
          'channels.created_at',
          (eb) =>
            eb
              .selectFrom('channel_participants')
              .select(({ fn }) => fn.count<number>('id').as('count'))
              .whereRef('channel_participants.channel_id', '=', 'channels.id')
              .where('channel_participants.left_at', 'is', null)
              .as('participantCount'),
        ])
        .where('channels.status', '=', 'active');

      // Filter private channels unless requested
      if (!input?.includePrivate) {
        query = query.where('channels.is_private', '=', false);
      }

      const channels = await query.orderBy('channels.created_at', 'desc').execute();

      return channels;
    }),

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
      const channel = await channelRepository.findById(input.channelId);

      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        });
      }

      // Get active participants
      const participants = await channelParticipantRepository.getActiveParticipants(input.channelId);

      return {
        channel,
        participants,
      };
    }),

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

      const channel = await channelRepository.findById(input.channelId);

      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        });
      }

      // Check if user is the host
      if (channel.host_id !== ctx.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the host can end the channel',
        });
      }

      // Update channel status
      await channelRepository.endChannel(input.channelId);

      // Mark all participants as left
      await channelParticipantRepository.removeAllParticipants(input.channelId);

      return { success: true };
    }),

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

      // Check if user is active participant
      const isActive = await channelParticipantRepository.isActiveParticipant(
        input.channelId,
        ctx.userId
      );

      if (!isActive) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not in this channel',
        });
      }

      // Mark as left
      await channelParticipantRepository.removeParticipant(input.channelId, ctx.userId);

      return { success: true };
    }),
});

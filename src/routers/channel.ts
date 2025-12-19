import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '../db';
import { TRPCError } from '@trpc/server';
import { generateAgoraToken, getAgoraAppId } from '../utils/agora';
import { sql } from 'kysely';

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
      const channel = await db
        .insertInto('channels')
        .values({
          name: input.name,
          host_id: ctx.userId,
          max_participants: input.maxParticipants,
          is_private: input.isPrivate,
          status: 'active',
          created_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Add host as first participant
      await db
        .insertInto('channel_participants')
        .values({
          channel_id: channel.id,
          user_id: ctx.userId,
          role: 'host',
          joined_at: new Date(),
        })
        .execute();

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
      const channel = await db
        .selectFrom('channels')
        .selectAll()
        .where('id', '=', input.channelId)
        .executeTakeFirst();

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
        .selectFrom('channel_participants')
        .select(({ fn }) => [fn.count<number>('id').as('count')])
        .where('channel_id', '=', input.channelId)
        .where('left_at', 'is', null)
        .executeTakeFirst();

      if (participantCount && participantCount.count >= (channel.max_participants || 10)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Channel is full',
        });
      }

      // Check if user already joined
      const existingParticipant = await db
        .selectFrom('channel_participants')
        .selectAll()
        .where('channel_id', '=', input.channelId)
        .where('user_id', '=', ctx.userId)
        .where('left_at', 'is', null)
        .executeTakeFirst();

      if (!existingParticipant) {
        // Add as new participant
        await db
          .insertInto('channel_participants')
          .values({
            channel_id: input.channelId,
            user_id: ctx.userId,
            role: 'audience',
            joined_at: new Date(),
          })
          .execute();
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
      const channel = await db
        .selectFrom('channels')
        .selectAll()
        .where('id', '=', input.channelId)
        .executeTakeFirst();

      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        });
      }

      // Get active participants
      const participants = await db
        .selectFrom('channel_participants')
        .selectAll()
        .where('channel_id', '=', input.channelId)
        .where('left_at', 'is', null)
        .execute();

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

      const channel = await db
        .selectFrom('channels')
        .selectAll()
        .where('id', '=', input.channelId)
        .executeTakeFirst();

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
      await db
        .updateTable('channels')
        .set({
          status: 'ended',
          ended_at: new Date(),
        })
        .where('id', '=', input.channelId)
        .execute();

      // Mark all participants as left
      await db
        .updateTable('channel_participants')
        .set({
          left_at: new Date(),
        })
        .where('channel_id', '=', input.channelId)
        .where('left_at', 'is', null)
        .execute();

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

      // Find active participation
      const participant = await db
        .selectFrom('channel_participants')
        .selectAll()
        .where('channel_id', '=', input.channelId)
        .where('user_id', '=', ctx.userId)
        .where('left_at', 'is', null)
        .executeTakeFirst();

      if (!participant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not in this channel',
        });
      }

      // Mark as left
      await db
        .updateTable('channel_participants')
        .set({
          left_at: new Date(),
        })
        .where('id', '=', participant.id)
        .execute();

      return { success: true };
    }),
});

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  channelRepository,
  channelParticipantRepository,
  shopRepository,
} from "../repositories";
import { TRPCError } from "@trpc/server";
import { generateAgoraToken, getAgoraAppId } from "../utils/agora";
import { sql } from "kysely";
import { db } from "../db";
import {
  broadcastToChannel,
  addUserToChannel,
  sendToConnection,
} from "../websocket/broadcast";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";
import { HybridStreamingService } from "../services/hybridStreamingService";

// Event emitter for channel events
const channelEvents = new EventEmitter();
channelEvents.setMaxListeners(100);

// Lazy initialization of HybridStreamingService
let hybridStreamingService: HybridStreamingService | null = null;
function getHybridStreamingService(): HybridStreamingService {
  if (!hybridStreamingService) {
    hybridStreamingService = new HybridStreamingService();
  }
  return hybridStreamingService;
}

async function isChannelHost(
  channelId: number,
  userId: number,
): Promise<boolean> {
  const channel = await db
    .selectFrom("channels")
    .select("host_id")
    .where("id", "=", channelId)
    .executeTakeFirst();

  return channel?.host_id === userId;
}

export const channelRouter = router({
  /**
   * Create a new live channel
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, "Name must be at least 3 characters").max(100),
        maxParticipants: z.number().min(2).max(50).default(10),
        isPrivate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check authentication
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a channel",
        });
      }

      // Check if user has at least one shop
      const userShops = await shopRepository.findByOwnerId(ctx.userId);
      if (userShops.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have at least one shop to create a channel",
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
        "host",
      );

      // Generate Agora token for host
      // Generate a dynamic UID to avoid conflicts when same user opens multiple tabs
      // Use userId as base + random component to ensure uniqueness
      const dynamicUid = ctx.userId * 10000 + Math.floor(Math.random() * 9999);

      const token = generateAgoraToken({
        channelName: channel.id.toString(),
        uid: dynamicUid,
        role: "host",
      });

      // Start hybrid streaming (Agora Cloud Recording → Cloudflare Stream)
      let hlsPlaybackUrl: string | null = null;
      try {
        const hybridStreaming = getHybridStreamingService();
        const result = await hybridStreaming.startHybridStreaming(
          channel.id,
          channel.id.toString(),
          dynamicUid,
        );
        hlsPlaybackUrl = result.hlsPlaybackUrl;
      } catch (error) {
        console.error(
          `Failed to start hybrid streaming for channel ${channel.id}:`,
          error,
        );
        // Continue anyway - seller can still stream via Agora
        // Buyers won't have HLS but could fallback to Agora if needed
      }

      return {
        channel: {
          ...channel,
          hlsPlaybackUrl: hlsPlaybackUrl || channel.hls_playback_url,
          relayStatus: channel.relay_status,
        },
        token,
        appId: getAgoraAppId(),
        uid: dynamicUid,
        isHost: true,
      };
    }),

  /**
   * Join an existing channel
   */
  join: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check authentication
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to join a channel",
        });
      }

      // Find channel
      const channel = await channelRepository.findById(input.channelId);

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if channel is active
      if (channel.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This channel has ended",
        });
      }

      // Check participant limit
      const hasReachedCapacity = await channelRepository.hasReachedCapacity(
        input.channelId,
      );

      if (hasReachedCapacity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Channel is full",
        });
      }

      // Check if user already joined
      const alreadyJoined =
        await channelParticipantRepository.isActiveParticipant(
          input.channelId,
          ctx.userId,
        );

      if (!alreadyJoined) {
        // Add as new participant
        await channelParticipantRepository.addParticipant(
          input.channelId,
          ctx.userId,
          "viewer",
        );
      }

      // Generate token for audience
      // Generate a dynamic UID to avoid conflicts when same user opens multiple tabs
      const dynamicUid = ctx.userId * 10000 + Math.floor(Math.random() * 9999);

      const token = generateAgoraToken({
        channelName: channel.id.toString(),
        uid: dynamicUid,
        role: "audience",
      });

      return {
        channel: {
          ...channel,
          hlsPlaybackUrl: channel.hls_playback_url,
          relayStatus: channel.relay_status,
        },
        token,
        appId: getAgoraAppId(),
        uid: dynamicUid,
        isHost: channel.host_id === ctx.userId,
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
        .optional(),
    )
    .query(async ({ input }) => {
      // Note: This query is complex with subquery, keeping direct db access for now
      // Could be refactored to repository if needed
      let query = db
        .selectFrom("channels")
        .select([
          "channels.id",
          "channels.name",
          "channels.host_id",
          "channels.max_participants",
          "channels.is_private",
          "channels.created_at",
          (eb) =>
            eb
              .selectFrom("channel_participants")
              .select(({ fn }) => fn.count<number>("id").as("count"))
              .whereRef("channel_participants.channel_id", "=", "channels.id")
              .where("channel_participants.left_at", "is", null)
              .as("participantCount"),
        ])
        .where("channels.status", "=", "active");

      // Filter private channels unless requested
      if (!input?.includePrivate) {
        query = query.where("channels.is_private", "=", false);
      }

      const channels = await query
        .orderBy("channels.created_at", "desc")
        .execute();

      return channels;
    }),

  /**
   * Get channel details with participants
   */
  get: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const channel = await channelRepository.findById(input.channelId);

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Get active participants
      const participants =
        await channelParticipantRepository.getActiveParticipants(
          input.channelId,
        );

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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const channel = await channelRepository.findById(input.channelId);

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Check if user is the host
      if (channel.host_id !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the host can end the channel",
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user is active participant
      const isActive = await channelParticipantRepository.isActiveParticipant(
        input.channelId,
        ctx.userId,
      );

      if (!isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not in this channel",
        });
      }

      // Check if user is the host
      const isHost = await isChannelHost(input.channelId, ctx.userId);

      // If host is leaving, stop hybrid streaming
      if (isHost) {
        try {
          const hybridStreaming = getHybridStreamingService();
          await hybridStreaming.stopHybridStreaming(input.channelId);
          console.log(
            `Hybrid streaming stopped for channel ${input.channelId} (host left)`,
          );
        } catch (error) {
          console.error(
            `Failed to stop hybrid streaming for channel ${input.channelId}:`,
            error,
          );
          // Continue anyway - user can still leave
        }
      }

      // Mark as left
      await channelParticipantRepository.removeParticipant(
        input.channelId,
        ctx.userId,
      );

      return { success: true };
    }),

  /**
   * Highlight a product in the channel (host only)
   */
  highlightProduct: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
        productId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user has SELLER role
      const userRoles = await db
        .selectFrom("user_roles")
        .innerJoin("roles", "roles.id", "user_roles.role_id")
        .select("roles.name")
        .where("user_roles.user_id", "=", ctx.userId)
        .execute();

      const hasSeller = userRoles.some((r) => r.name === "SELLER");
      if (!hasSeller) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only sellers can highlight products",
        });
      }

      // Verify channel exists
      const channel = await channelRepository.findById(input.channelId);
      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Verify user is channel host
      const isHost = await isChannelHost(input.channelId, ctx.userId);
      if (!isHost) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the channel host can highlight products",
        });
      }

      // Verify product is associated with this channel
      const channelProduct = await db
        .selectFrom("channel_products")
        .select(["id", "product_id"])
        .where("channel_id", "=", input.channelId)
        .where("product_id", "=", input.productId)
        .executeTakeFirst();

      if (!channelProduct) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Product is not associated with this channel",
        });
      }

      // Verify product exists
      const product = await db
        .selectFrom("products")
        .select(["id", "name", "price", "description", "image_url"])
        .where("id", "=", input.productId)
        .executeTakeFirst();

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check if there's an active auction in this channel
      const activeAuction = await db
        .selectFrom("auctions")
        .select(["id", "product_id"])
        .where("channel_id", "=", input.channelId)
        .where("status", "=", "active")
        .executeTakeFirst();

      if (activeAuction) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot change highlighted product while an auction is active. Please wait for the current auction to end.",
        });
      }

      // Update channel with highlighted product
      const highlightedAt = new Date();
      await db
        .updateTable("channels")
        .set({
          highlighted_product_id: input.productId,
          highlighted_at: highlightedAt,
        })
        .where("id", "=", input.channelId)
        .execute();

      // Prepare highlight event message
      const highlightMessage = {
        type: "PRODUCT_HIGHLIGHTED" as const,
        channelId: input.channelId,
        product: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price ?? "0"),
          description: product.description ?? "",
          imageUrl: product.image_url,
        },
        highlightedAt: highlightedAt.toISOString(),
      };

      // Broadcast via WebSocket
      broadcastToChannel(input.channelId, highlightMessage);

      // Emit via EventEmitter for tRPC subscriptions
      channelEvents.emit(`channel:${input.channelId}:events`, highlightMessage);

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price ?? "0"),
          description: product.description ?? "",
          imageUrl: product.image_url,
        },
      };
    }),

  /**
   * Unhighlight the current product in the channel (host only)
   */
  unhighlightProduct: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Check if user has SELLER role
      const userRoles = await db
        .selectFrom("user_roles")
        .innerJoin("roles", "roles.id", "user_roles.role_id")
        .select("roles.name")
        .where("user_roles.user_id", "=", ctx.userId)
        .execute();

      const hasSeller = userRoles.some((r) => r.name === "SELLER");
      if (!hasSeller) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only sellers can unhighlight products",
        });
      }

      // Verify channel exists
      const channel = await channelRepository.findById(input.channelId);
      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // Verify user is channel host
      const isHost = await isChannelHost(input.channelId, ctx.userId);
      if (!isHost) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the channel host can unhighlight products",
        });
      }

      // Check if there's an active auction in this channel
      const activeAuction = await db
        .selectFrom("auctions")
        .select(["id", "product_id"])
        .where("channel_id", "=", input.channelId)
        .where("status", "=", "active")
        .executeTakeFirst();

      if (activeAuction) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot unhighlight product while an auction is active. Please wait for the current auction to end.",
        });
      }

      // Update channel to remove highlighted product
      await db
        .updateTable("channels")
        .set({
          highlighted_product_id: null,
          highlighted_at: null,
        })
        .where("id", "=", input.channelId)
        .execute();

      // Prepare unhighlight event message
      const unhighlightMessage = {
        type: "PRODUCT_UNHIGHLIGHTED" as const,
        channelId: input.channelId,
      };

      // Broadcast via WebSocket
      broadcastToChannel(input.channelId, unhighlightMessage);

      // Emit via EventEmitter for tRPC subscriptions
      channelEvents.emit(
        `channel:${input.channelId}:events`,
        unhighlightMessage,
      );

      return { success: true };
    }),

  /**
   * Get the currently highlighted product in the channel
   */
  getHighlightedProduct: publicProcedure
    .input(
      z.object({
        channelId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      // Verify channel exists
      const channel = await db
        .selectFrom("channels")
        .select(["id", "highlighted_product_id", "highlighted_at"])
        .where("id", "=", input.channelId)
        .executeTakeFirst();

      if (!channel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      // If no highlighted product, return null
      if (!channel.highlighted_product_id) {
        return {
          product: null,
          highlightedAt: null,
        };
      }

      // Fetch product details
      const product = await db
        .selectFrom("products")
        .select(["id", "name", "price", "description", "image_url"])
        .where("id", "=", channel.highlighted_product_id)
        .executeTakeFirst();

      if (!product) {
        return {
          product: null,
          highlightedAt: null,
        };
      }

      return {
        product: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price ?? "0"),
          description: product.description ?? "",
          imageUrl: product.image_url,
        },
        highlightedAt: channel.highlighted_at,
      };
    }),

  /**
   * Subscribe to channel events (product highlights, etc.)
   */
  subscribeToEvents: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .subscription(async ({ input, ctx }) => {
      console.log(
        `📡 User ${ctx.userId || "anonymous"} subscribed to channel events: ${input.channelId}`,
      );

      return observable<any>((emit) => {
        const eventName = `channel:${input.channelId}:events`;

        const handler = (data: any) => {
          console.log(
            `📨 Sending event to subscriber on ${eventName}:`,
            data.type,
          );
          emit.next(data);
        };

        channelEvents.on(eventName, handler);

        // Send current highlighted product immediately after subscription
        (async () => {
          try {
            const channel = await db
              .selectFrom("channels")
              .select(["highlighted_product_id", "highlighted_at"])
              .where("id", "=", input.channelId)
              .executeTakeFirst();

            if (channel?.highlighted_product_id) {
              const product = await db
                .selectFrom("products")
                .selectAll()
                .where("id", "=", channel.highlighted_product_id)
                .executeTakeFirst();

              if (product) {
                emit.next({
                  type: "PRODUCT_HIGHLIGHTED",
                  channelId: input.channelId,
                  product: {
                    id: product.id,
                    name: product.name,
                    price: parseFloat(product.price ?? "0"),
                    description: product.description ?? "",
                    imageUrl: product.image_url,
                  },
                  highlightedAt: channel.highlighted_at?.toISOString(),
                });
              }
            }
          } catch (error) {
            console.error("Error fetching initial highlighted product:", error);
          }
        })();

        // Cleanup on unsubscribe
        return () => {
          console.log(`📴 User unsubscribed from ${eventName}`);
          channelEvents.off(eventName, handler);
        };
      });
    }),

  /**
   * Get streaming status for a channel
   * Used by clients to poll HLS availability and relay status
   */
  getStatus: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const hybridStreaming = getHybridStreamingService();
      return hybridStreaming.getStreamingStatus(input.channelId);
    }),

  /**
   * Health check for streaming services
   */
  healthCheck: publicProcedure.query(async () => {
    const hybridStreaming = getHybridStreamingService();
    return hybridStreaming.healthCheck();
  }),
});

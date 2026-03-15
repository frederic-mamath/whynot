import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  liveRepository,
  liveParticipantRepository,
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

// Event emitter for live events (shared with channel router alias)
export const liveEvents = new EventEmitter();
liveEvents.setMaxListeners(100);

async function isLiveHost(liveId: number, userId: number): Promise<boolean> {
  return liveRepository.isHost(liveId, userId);
}

export const liveRouter = router({
  /**
   * Schedule a new live for a future date
   */
  schedule: publicProcedure
    .input(
      z.object({
        name: z.string().min(3, "Name must be at least 3 characters").max(100),
        description: z.string().max(500).optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime().optional(),
        coverUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to schedule a live",
        });
      }

      const userShops = await shopRepository.findByOwnerId(ctx.userId);
      if (userShops.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have at least one shop to schedule a live",
        });
      }

      const live = await liveRepository.schedule({
        name: input.name,
        host_id: ctx.userId,
        description: input.description ?? null,
        starts_at: new Date(input.startsAt),
        ends_at: input.endsAt ? new Date(input.endsAt) : null,
        cover_url: input.coverUrl ?? null,
      });

      return { live };
    }),

  /**
   * Update a scheduled live's fields
   */
  update: publicProcedure
    .input(
      z.object({
        liveId: z.number(),
        name: z.string().min(3).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional().nullable(),
        coverUrl: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const host = await isLiveHost(input.liveId, ctx.userId);
      if (!host) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the host can update this live",
        });
      }

      const live = await liveRepository.update(input.liveId, {
        name: input.name,
        description: input.description,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt:
          input.endsAt !== undefined
            ? input.endsAt
              ? new Date(input.endsAt)
              : null
            : undefined,
        coverUrl: input.coverUrl,
      });

      if (!live) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live not found" });
      }

      return { live };
    }),

  /**
   * List lives for a host (upcoming scheduled + past)
   */
  listByHost: publicProcedure
    .input(z.object({ hostId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const hostId = input?.hostId ?? ctx.userId;
      if (!hostId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const [upcoming, past] = await Promise.all([
        liveRepository.findScheduledByHost(hostId),
        liveRepository.findPastByHost(hostId),
      ]);

      return { upcoming, past };
    }),

  /**
   * Create a new live channel and immediately go live
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
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to create a channel",
        });
      }

      const userShops = await shopRepository.findByOwnerId(ctx.userId);
      if (userShops.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have at least one shop to create a channel",
        });
      }

      const live = await liveRepository.save({
        name: input.name,
        host_id: ctx.userId,
        max_participants: input.maxParticipants,
        is_private: input.isPrivate,
      });

      await liveParticipantRepository.addParticipant(
        live.id,
        ctx.userId,
        "host",
      );

      const dynamicUid = ctx.userId * 10000 + Math.floor(Math.random() * 9999);
      const token = generateAgoraToken({
        channelName: live.id.toString(),
        uid: dynamicUid,
        role: "host",
      });

      return {
        channel: live,
        token,
        appId: getAgoraAppId(),
        uid: dynamicUid,
        isHost: true,
      };
    }),

  /**
   * Join an existing live
   */
  join: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to join a channel",
        });
      }

      const live = await liveRepository.findById(input.channelId);
      if (!live) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      const now = new Date();
      const isEnded =
        live.ended_at !== null ||
        (live.ends_at !== null && live.ends_at <= now);
      const isActive =
        !isEnded &&
        live.starts_at <= now &&
        (live.ends_at === null || live.ends_at > now);
      const liveStatus: "upcoming" | "active" | "ended" = isEnded
        ? "ended"
        : isActive
          ? "active"
          : "upcoming";

      const liveMeta = {
        name: live.name,
        startsAt: live.starts_at.toISOString(),
        endsAt: live.ends_at ? live.ends_at.toISOString() : null,
      };

      // If not active, return status without creating participant or Agora token
      if (liveStatus !== "active") {
        return { liveStatus, live: liveMeta };
      }

      const hasReachedCapacity = await liveRepository.hasReachedCapacity(
        input.channelId,
      );
      if (hasReachedCapacity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Channel is full",
        });
      }

      const alreadyJoined = await liveParticipantRepository.isActiveParticipant(
        input.channelId,
        ctx.userId,
      );

      if (!alreadyJoined) {
        await liveParticipantRepository.addParticipant(
          input.channelId,
          ctx.userId,
          "viewer",
        );
      }

      const dynamicUid = ctx.userId * 10000 + Math.floor(Math.random() * 9999);
      const isHost = live.host_id === ctx.userId;
      const token = generateAgoraToken({
        channelName: live.id.toString(),
        uid: dynamicUid,
        role: isHost ? "host" : "audience",
      });

      return {
        liveStatus: "active" as const,
        channel: live,
        token,
        appId: getAgoraAppId(),
        uid: dynamicUid,
        isHost,
        live: liveMeta,
      };
    }),

  /**
   * List all active lives
   */
  list: publicProcedure
    .input(z.object({ includePrivate: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      let query = db
        .selectFrom("lives")
        .innerJoin("users", "users.id", "lives.host_id")
        .select([
          "lives.id",
          "lives.name",
          "lives.host_id",
          "lives.cover_url",
          "lives.max_participants",
          "lives.is_private",
          "lives.created_at",
          "users.nickname as host_nickname",
          "users.avatar_url as host_avatar_url",
          (eb) =>
            eb
              .selectFrom("live_participants")
              .select(({ fn }) => fn.count<number>("id").as("count"))
              .whereRef("live_participants.live_id", "=", "lives.id")
              .where("live_participants.left_at", "is", null)
              .as("participantCount"),
        ])
        .where((eb) => {
          const now = new Date();
          return eb.and([
            eb("lives.starts_at", "<=", now),
            eb.or([
              eb("lives.ends_at", "is", null),
              eb("lives.ends_at", ">", now),
            ]),
            eb("lives.ended_at", "is", null),
          ]);
        });

      if (!input?.includePrivate) {
        query = query.where("lives.is_private", "=", false);
      }

      return query.orderBy("lives.created_at", "desc").execute();
    }),

  /**
   * Get live details with participants
   */
  get: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const live = await liveRepository.findById(input.channelId);
      if (!live) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      const participants =
        await liveParticipantRepository.getActiveParticipants(input.channelId);

      return { channel: live, participants };
    }),

  /**
   * Get live participants with display names
   */
  participants: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input, ctx }) => {
      const participants =
        await liveParticipantRepository.getActiveParticipantsWithUserInfo(
          input.channelId,
        );

      return participants.map((p) => {
        const hasName = p.firstname || p.lastname;
        const displayName = hasName
          ? [p.firstname, p.lastname].filter(Boolean).join(" ")
          : p.email;

        return {
          userId: p.user_id,
          displayName,
          email: p.email,
          role: p.role,
          joinedAt: p.joined_at,
          isCurrentUser: p.user_id === ctx.userId,
        };
      });
    }),

  /**
   * End a live (host only)
   */
  end: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const live = await liveRepository.findById(input.channelId);
      if (!live) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      if (live.host_id !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the host can end the channel",
        });
      }

      await liveRepository.endLive(input.channelId);
      await liveParticipantRepository.removeAllParticipants(input.channelId);

      return { success: true };
    }),

  /**
   * Leave a live
   */
  leave: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const isActive = await liveParticipantRepository.isActiveParticipant(
        input.channelId,
        ctx.userId,
      );

      if (!isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not in this channel",
        });
      }

      await liveParticipantRepository.removeParticipant(
        input.channelId,
        ctx.userId,
      );

      return { success: true };
    }),

  /**
   * Highlight a product in the live (host only)
   */
  highlightProduct: publicProcedure
    .input(z.object({ channelId: z.number(), productId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRoles = await db
        .selectFrom("user_roles")
        .innerJoin("roles", "roles.id", "user_roles.role_id")
        .select("roles.name")
        .where("user_roles.user_id", "=", ctx.userId)
        .execute();

      if (!userRoles.some((r) => r.name === "SELLER")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only sellers can highlight products",
        });
      }

      const live = await liveRepository.findById(input.channelId);
      if (!live) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      if (!(await isLiveHost(input.channelId, ctx.userId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the channel host can highlight products",
        });
      }

      const liveProduct = await db
        .selectFrom("live_products")
        .select(["id", "product_id"])
        .where("live_id", "=", input.channelId)
        .where("product_id", "=", input.productId)
        .executeTakeFirst();

      if (!liveProduct) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Product is not associated with this channel",
        });
      }

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

      const highlightedAt = new Date();
      await db
        .updateTable("lives")
        .set({
          highlighted_product_id: input.productId,
          highlighted_at: highlightedAt,
        })
        .where("id", "=", input.channelId)
        .execute();

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

      broadcastToChannel(input.channelId, highlightMessage);
      liveEvents.emit(`channel:${input.channelId}:events`, highlightMessage);

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
   * Unhighlight the current product (host only)
   */
  unhighlightProduct: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const userRoles = await db
        .selectFrom("user_roles")
        .innerJoin("roles", "roles.id", "user_roles.role_id")
        .select("roles.name")
        .where("user_roles.user_id", "=", ctx.userId)
        .execute();

      if (!userRoles.some((r) => r.name === "SELLER")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only sellers can unhighlight products",
        });
      }

      const live = await liveRepository.findById(input.channelId);
      if (!live) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      if (!(await isLiveHost(input.channelId, ctx.userId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the channel host can unhighlight products",
        });
      }

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

      await db
        .updateTable("lives")
        .set({ highlighted_product_id: null, highlighted_at: null })
        .where("id", "=", input.channelId)
        .execute();

      const unhighlightMessage = {
        type: "PRODUCT_UNHIGHLIGHTED" as const,
        channelId: input.channelId,
      };

      broadcastToChannel(input.channelId, unhighlightMessage);
      liveEvents.emit(`channel:${input.channelId}:events`, unhighlightMessage);

      return { success: true };
    }),

  /**
   * Get the currently highlighted product in the live
   */
  getHighlightedProduct: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in",
        });
      }

      const live = await db
        .selectFrom("lives")
        .select(["id", "highlighted_product_id", "highlighted_at"])
        .where("id", "=", input.channelId)
        .executeTakeFirst();

      if (!live) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Channel not found",
        });
      }

      if (!live.highlighted_product_id) {
        return { product: null, highlightedAt: null };
      }

      const product = await db
        .selectFrom("products")
        .select(["id", "name", "price", "description", "image_url"])
        .where("id", "=", live.highlighted_product_id)
        .executeTakeFirst();

      if (!product) {
        return { product: null, highlightedAt: null };
      }

      return {
        product: {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price ?? "0"),
          description: product.description ?? "",
          imageUrl: product.image_url,
        },
        highlightedAt: live.highlighted_at,
      };
    }),

  /**
   * Subscribe to live events (product highlights, etc.)
   */
  subscribeToEvents: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .subscription(async ({ input, ctx }) => {
      console.log(
        `📡 User ${ctx.userId || "anonymous"} subscribed to live events: ${input.channelId}`,
      );

      return observable<any>((emit) => {
        const eventName = `channel:${input.channelId}:events`;

        const handler = (data: any) => {
          emit.next(data);
        };

        liveEvents.on(eventName, handler);

        // Send current highlighted product immediately after subscription
        (async () => {
          try {
            const live = await db
              .selectFrom("lives")
              .select(["highlighted_product_id", "highlighted_at"])
              .where("id", "=", input.channelId)
              .executeTakeFirst();

            if (live?.highlighted_product_id) {
              const product = await db
                .selectFrom("products")
                .selectAll()
                .where("id", "=", live.highlighted_product_id)
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
                  highlightedAt: live.highlighted_at?.toISOString(),
                });
              }
            }
          } catch (error) {
            console.error("Error fetching initial highlighted product:", error);
          }
        })();

        return () => {
          console.log(`📴 User unsubscribed from ${eventName}`);
          liveEvents.off(eventName, handler);
        };
      });
    }),
  /**
   * Get the next globally scheduled live (for homepage highlight)
   */
  nextScheduled: publicProcedure.query(async () => {
    const live = await liveRepository.findNextScheduled();
    if (!live) return null;

    return {
      id: live.id,
      name: live.name,
      description: live.description ?? null,
      startsAt: live.starts_at.toISOString(),
      endsAt: live.ends_at ? live.ends_at.toISOString() : null,
      coverUrl: live.cover_url ?? null,
      host: {
        nickname: live.host_nickname,
        avatarUrl: live.host_avatar_url ?? null,
      },
    };
  }),
});

// Backward compat alias – channel.ts re-exports this
export { liveRouter as channelRouter };

import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  shopRepository,
  userShopRoleRepository,
  userRepository,
  sellerFollowerRepository,
} from "../repositories";
import { TRPCError } from "@trpc/server";
import { requireShopOwner, requireShopAccess } from "../middleware/shopOwner";
import {
  mapShopToShopOutboundDto,
  mapShopWithRoleToShopWithRoleOutboundDto,
  mapCreateShopInboundDtoToShop,
} from "../mappers";
import { db } from "../db";
import { sql } from "kysely";

export const shopRouter = router({
  /**
   * List sellers (shop owners) with their top 3 product categories.
   * Accepts an optional limit; returns hasMore: true when more sellers exist beyond the limit.
   */
  listSellers: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const { limit } = input;

      // Get shops with their owner info (fetch limit+1 to detect hasMore)
      const baseQuery = db
        .selectFrom("shops")
        .innerJoin("users", "users.id", "shops.owner_id")
        .select([
          "shops.id as shopId",
          "shops.name as shopName",
          "users.id as userId",
          "users.nickname",
          "users.avatar_url as avatarUrl",
        ]);

      const shops = await (limit !== undefined
        ? baseQuery.limit(limit + 1)
        : baseQuery
      ).execute();

      const hasMore = limit !== undefined && shops.length > limit;
      const paginatedShops = hasMore ? shops.slice(0, limit) : shops;

      // Batch-fetch follow state for the current user
      const followedRows = await db
        .selectFrom("seller_followers")
        .select("seller_id")
        .where("follower_id", "=", ctx.user.id)
        .execute();
      const followedIds = new Set(followedRows.map((r) => r.seller_id));

      // For each shop, fetch top 3 categories by product count
      const sellers = await Promise.all(
        paginatedShops.map(async (shop) => {
          const topCategories = await db
            .selectFrom("products")
            .innerJoin("categories", "categories.id", "products.category_id")
            .select([
              "categories.name",
              "categories.emoji",
              db.fn.count("products.id").as("count"),
            ])
            .where("products.shop_id", "=", shop.shopId)
            .where("products.is_active", "=", true)
            .where("products.category_id", "is not", null)
            .groupBy(["categories.id", "categories.name", "categories.emoji"])
            .orderBy("count", "desc")
            .limit(3)
            .execute();

          return {
            userId: shop.userId,
            nickname: shop.nickname,
            avatarUrl: shop.avatarUrl,
            shopId: shop.shopId,
            shopName: shop.shopName,
            topCategories: topCategories.map((c) => ({
              name: c.name,
              emoji: c.emoji,
            })),
            isFollowed: followedIds.has(shop.userId),
          };
        }),
      );

      return { sellers, hasMore };
    }),

  /**
   * List all sellers ordered by nickname ASC. Used by the /sellers discovery page.
   */
  listAllSellers: protectedProcedure.query(async ({ ctx }) => {
    const sellers = await db
      .selectFrom("shops")
      .innerJoin("users", "users.id", "shops.owner_id")
      .select(["users.id as userId", "users.nickname"])
      .orderBy("users.nickname", "asc")
      .execute();

    const followedRows = await db
      .selectFrom("seller_followers")
      .select("seller_id")
      .where("follower_id", "=", ctx.user.id)
      .execute();
    const followedIds = new Set(followedRows.map((r) => r.seller_id));

    return sellers.map((s) => ({ ...s, isFollowed: followedIds.has(s.userId) }));
  }),

  followSeller: protectedProcedure
    .input(z.object({ sellerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await sellerFollowerRepository.follow(ctx.user.id, input.sellerId);
      return { success: true };
    }),

  unfollowSeller: protectedProcedure
    .input(z.object({ sellerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await sellerFollowerRepository.unfollow(ctx.user.id, input.sellerId);
      return { success: true };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopData = mapCreateShopInboundDtoToShop(input, ctx.user.id);

      // Create shop using repository
      const shop = await shopRepository.save(shopData);

      // Assign owner role using repository
      await userShopRoleRepository.assignRole(
        ctx.user.id,
        shop.id,
        "shop-owner",
      );

      return mapShopToShopOutboundDto(shop);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Find shops where user has a role using repository
    const results = await shopRepository.findByUserWithRole(ctx.user.id);

    return results.map((r) =>
      mapShopWithRoleToShopWithRoleOutboundDto(
        {
          id: r.id,
          name: r.name,
          description: r.description,
          owner_id: r.owner_id,
          created_at: r.created_at,
          updated_at: r.updated_at,
        },
        r.role,
      ),
    );
  }),

  get: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      const shop = await shopRepository.findById(input.shopId);

      if (!shop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop not found",
        });
      }

      return mapShopToShopOutboundDto(shop);
    }),

  getMyShop: protectedProcedure.query(async ({ ctx }) => {
    const shops = await shopRepository.findByOwnerId(ctx.user.id);
    const shop = shops[0] ?? null;

    if (!shop) {
      return null;
    }

    return mapShopToShopOutboundDto(shop);
  }),

  getOrCreateMyShop: protectedProcedure.query(async ({ ctx }) => {
    const shops = await shopRepository.findByOwnerId(ctx.user.id);
    const existing = shops[0] ?? null;

    if (existing) {
      return mapShopToShopOutboundDto(existing);
    }

    const shopData = mapCreateShopInboundDtoToShop(
      { name: "Ma boutique" },
      ctx.user.id,
    );
    const shop = await shopRepository.save(shopData);

    await userShopRoleRepository.assignRole(ctx.user.id, shop.id, "shop-owner");

    return mapShopToShopOutboundDto(shop);
  }),

  update: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      const updateData: { name?: string; description?: string } = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;

      const shop = await shopRepository.updateById(input.shopId, updateData);

      if (!shop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop not found",
        });
      }

      return mapShopToShopOutboundDto(shop);
    }),

  delete: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      await shopRepository.deleteById(input.shopId);

      return { success: true };
    }),

  addVendor: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      // Check if user exists
      const user = await userRepository.findById(input.userId);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user already has vendor role
      const alreadyVendor =
        await userShopRoleRepository.existsByUserAndShopAndRole(
          input.userId,
          input.shopId,
          "vendor",
        );

      if (alreadyVendor) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a vendor for this shop",
        });
      }

      // Assign vendor role
      const role = await userShopRoleRepository.assignRole(
        input.userId,
        input.shopId,
        "vendor",
      );

      return role;
    }),

  removeVendor: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      await userShopRoleRepository.removeRole(
        input.userId,
        input.shopId,
        "vendor",
      );

      return { success: true };
    }),

  listVendors: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireShopAccess(ctx, input.shopId);

      const vendors = await userShopRoleRepository.findVendorsByShop(
        input.shopId,
      );

      return vendors;
    }),
});

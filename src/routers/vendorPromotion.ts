import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { TRPCError } from '@trpc/server';
import type { Context } from '../types/context';

async function requireVendorAccess(ctx: Context, productId: number): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  const product = await db
    .selectFrom('products')
    .select(['shop_id'])
    .where('id', '=', productId)
    .executeTakeFirst();

  if (!product) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Product not found',
    });
  }

  const role = await db
    .selectFrom('user_shop_roles')
    .select(['role'])
    .where('user_id', '=', ctx.user.id)
    .where('shop_id', '=', product.shop_id)
    .executeTakeFirst();

  if (!role) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this product',
    });
  }
}

export const vendorPromotionRouter = router({
  promote: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        productId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireVendorAccess(ctx, input.productId);

      const association = await db
        .selectFrom('channel_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('product_id', '=', input.productId)
        .executeTakeFirst();

      if (!association) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Product must be associated with the channel before promotion',
        });
      }

      const existing = await db
        .selectFrom('vendor_promoted_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('vendor_id', '=', ctx.user.id)
        .where('product_id', '=', input.productId)
        .where('unpromoted_at', 'is', null)
        .executeTakeFirst();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already promoting this product',
        });
      }

      const promotion = await db
        .insertInto('vendor_promoted_products')
        .values({
          channel_id: input.channelId,
          vendor_id: ctx.user.id,
          product_id: input.productId,
          promoted_at: new Date(),
          unpromoted_at: null,
        })
        .returning([
          'id',
          'channel_id',
          'vendor_id',
          'product_id',
          'promoted_at',
          'unpromoted_at',
        ])
        .executeTakeFirstOrThrow();

      return promotion;
    }),

  unpromote: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        productId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireVendorAccess(ctx, input.productId);

      const promotion = await db
        .selectFrom('vendor_promoted_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('vendor_id', '=', ctx.user.id)
        .where('product_id', '=', input.productId)
        .where('unpromoted_at', 'is', null)
        .executeTakeFirst();

      if (!promotion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active promotion not found',
        });
      }

      const updated = await db
        .updateTable('vendor_promoted_products')
        .set({ unpromoted_at: new Date() })
        .where('id', '=', promotion.id)
        .returning([
          'id',
          'channel_id',
          'vendor_id',
          'product_id',
          'promoted_at',
          'unpromoted_at',
        ])
        .executeTakeFirstOrThrow();

      return updated;
    }),

  listActive: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const promotions = await db
        .selectFrom('vendor_promoted_products')
        .innerJoin('products', 'products.id', 'vendor_promoted_products.product_id')
        .innerJoin('users', 'users.id', 'vendor_promoted_products.vendor_id')
        .innerJoin('shops', 'shops.id', 'products.shop_id')
        .select([
          'vendor_promoted_products.id as promotion_id',
          'vendor_promoted_products.promoted_at',
          'products.id as product_id',
          'products.name as product_name',
          'products.description as product_description',
          'products.price as product_price',
          'products.image_url as product_image',
          'users.id as vendor_id',
          'users.email as vendor_name',
          'shops.id as shop_id',
          'shops.name as shop_name',
        ])
        .where('vendor_promoted_products.channel_id', '=', input.channelId)
        .where('vendor_promoted_products.unpromoted_at', 'is', null)
        .where('products.is_active', '=', true)
        .orderBy('vendor_promoted_products.promoted_at', 'desc')
        .execute();

      return promotions;
    }),

  listByVendor: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        vendorId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const promotions = await db
        .selectFrom('vendor_promoted_products')
        .innerJoin('products', 'products.id', 'vendor_promoted_products.product_id')
        .select([
          'vendor_promoted_products.id as promotion_id',
          'vendor_promoted_products.promoted_at',
          'vendor_promoted_products.unpromoted_at',
          'products.id as product_id',
          'products.name as product_name',
          'products.description as product_description',
          'products.price as product_price',
          'products.image_url as product_image',
        ])
        .where('vendor_promoted_products.channel_id', '=', input.channelId)
        .where('vendor_promoted_products.vendor_id', '=', input.vendorId)
        .orderBy('vendor_promoted_products.promoted_at', 'desc')
        .execute();

      return promotions;
    }),

  myActivePromotions: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const promotions = await db
        .selectFrom('vendor_promoted_products')
        .innerJoin('products', 'products.id', 'vendor_promoted_products.product_id')
        .select([
          'vendor_promoted_products.id as promotion_id',
          'vendor_promoted_products.promoted_at',
          'products.id as product_id',
          'products.name as product_name',
          'products.description as product_description',
          'products.price as product_price',
          'products.image_url as product_image',
          'products.shop_id',
        ])
        .where('vendor_promoted_products.channel_id', '=', input.channelId)
        .where('vendor_promoted_products.vendor_id', '=', ctx.user.id)
        .where('vendor_promoted_products.unpromoted_at', 'is', null)
        .orderBy('vendor_promoted_products.promoted_at', 'desc')
        .execute();

      return promotions;
    }),

  availableProducts: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userShops = await db
        .selectFrom('user_shop_roles')
        .select(['shop_id'])
        .where('user_id', '=', ctx.user.id)
        .execute();

      const shopIds = userShops.map((s) => s.shop_id);

      if (shopIds.length === 0) {
        return [];
      }

      const products = await db
        .selectFrom('products')
        .innerJoin('channel_products', 'channel_products.product_id', 'products.id')
        .leftJoin(
          (eb) =>
            eb
              .selectFrom('vendor_promoted_products')
              .select([
                'product_id',
                'vendor_id',
                'unpromoted_at',
              ])
              .where('vendor_id', '=', ctx.user.id)
              .where('unpromoted_at', 'is', null)
              .as('vpp'),
          (join) => join.onRef('vpp.product_id', '=', 'products.id')
        )
        .select([
          'products.id',
          'products.shop_id',
          'products.name',
          'products.description',
          'products.price',
          'products.image_url',
          (eb) =>
            eb
              .case()
              .when('vpp.product_id', 'is not', null)
              .then(true)
              .else(false)
              .end()
              .as('is_promoted'),
        ])
        .where('channel_products.channel_id', '=', input.channelId)
        .where('products.shop_id', 'in', shopIds)
        .where('products.is_active', '=', true)
        .orderBy('products.created_at', 'desc')
        .execute();

      return products;
    }),
});

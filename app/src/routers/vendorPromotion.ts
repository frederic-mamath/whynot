import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { 
  vendorPromotedProductRepository, 
  productRepository, 
  userShopRoleRepository,
  channelProductRepository 
} from '../repositories';
import { TRPCError } from '@trpc/server';
import type { Context } from '../types/context';
import { db } from '../db';

async function requireVendorAccess(ctx: Context, productId: number): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  const shopId = await productRepository.getShopId(productId);

  if (!shopId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Product not found',
    });
  }

  const hasAccess = await userShopRoleRepository.hasShopAccess(ctx.user.id, shopId);

  if (!hasAccess) {
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

      // Check if product is associated with channel
      const isAssociated = await channelProductRepository.isAssociated(
        input.channelId,
        input.productId
      );

      if (!isAssociated) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Product must be associated with the channel before promotion',
        });
      }

      // Check if already promoting
      const alreadyPromoting = await vendorPromotedProductRepository.isPromoting(
        input.channelId,
        ctx.user.id,
        input.productId
      );

      if (alreadyPromoting) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already promoting this product',
        });
      }

      const promotion = await vendorPromotedProductRepository.promote(
        input.channelId,
        ctx.user.id,
        input.productId
      );

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

      const isPromoting = await vendorPromotedProductRepository.isPromoting(
        input.channelId,
        ctx.user.id,
        input.productId
      );

      if (!isPromoting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active promotion not found',
        });
      }

      await vendorPromotedProductRepository.unpromote(
        input.channelId,
        ctx.user.id,
        input.productId
      );

      return { success: true };
    }),

  listActive: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Note: Complex query with multiple joins, keeping direct db access
      // Could be refactored if needed
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
      // Note: Complex query with joins, keeping direct db access
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
      // Note: Complex query with joins, keeping direct db access
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
      // Note: Very complex query with subquery and joins, keeping direct db access
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

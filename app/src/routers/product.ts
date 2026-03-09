import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  productRepository,
  channelProductRepository,
  userShopRoleRepository,
  productImageRepository,
} from "../repositories";
import { TRPCError } from "@trpc/server";
import type { Context } from "../types/context";
import {
  mapProductToProductOutboundDto,
  mapProductWithShopToProductWithShopOutboundDto,
  mapCreateProductInboundDtoToProduct,
  mapUpdateProductInboundDtoToProduct,
} from "../mappers";

async function requireProductAccess(
  ctx: Context,
  shopId: number,
): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }

  const hasAccess = await userShopRoleRepository.hasShopAccess(
    ctx.user.id,
    shopId,
  );

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have access to this shop",
    });
  }
}

export const productRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        imageUrl: z.string().url().optional().nullable(),
        startingPrice: z.number().min(0).optional(),
        wishedPrice: z.number().min(0).optional(),
        categoryId: z.number().optional(),
        conditionId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProductAccess(ctx, input.shopId);

      const productData = mapCreateProductInboundDtoToProduct({
        shopId: input.shopId,
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        startingPrice: input.startingPrice,
        wishedPrice: input.wishedPrice,
        categoryId: input.categoryId,
        conditionId: input.conditionId,
      });

      const product = await productRepository.save(productData);

      return mapProductToProductOutboundDto(product);
    }),

  list: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        activeOnly: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireProductAccess(ctx, input.shopId);

      const products = await productRepository.findByShopId(
        input.shopId,
        input.activeOnly,
      );

      return products.map(mapProductToProductOutboundDto);
    }),

  get: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const product = await productRepository.findById(input.productId);

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await requireProductAccess(ctx, product.shop_id);
      return mapProductToProductOutboundDto(product);
    }),

  update: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        imageUrl: z.string().url().optional().nullable(),
        isActive: z.boolean().optional(),
        startingPrice: z.number().min(0).optional(),
        wishedPrice: z.number().min(0).optional(),
        categoryId: z.number().nullable().optional(),
        conditionId: z.number().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await productRepository.getShopId(input.productId);

      if (!shopId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await requireProductAccess(ctx, shopId);

      const updateData = mapUpdateProductInboundDtoToProduct({
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl,
        isActive: input.isActive,
      });

      const product = await productRepository.updateById(
        input.productId,
        updateData,
      );

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return mapProductToProductOutboundDto(product);
    }),

  delete: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const shopId = await productRepository.getShopId(input.productId);

      if (!shopId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await requireProductAccess(ctx, shopId);

      await productRepository.deleteById(input.productId);

      return { success: true };
    }),

  associateToChannel: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        channelId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await productRepository.getShopId(input.productId);

      if (!shopId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await requireProductAccess(ctx, shopId);

      const alreadyAssociated = await channelProductRepository.isAssociated(
        input.channelId,
        input.productId,
      );

      if (alreadyAssociated) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Product is already associated with this channel",
        });
      }

      const association = await channelProductRepository.associate(
        input.channelId,
        input.productId,
      );

      return association;
    }),

  removeFromChannel: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        channelId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await productRepository.getShopId(input.productId);

      if (!shopId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await requireProductAccess(ctx, shopId);

      await channelProductRepository.remove(input.channelId, input.productId);

      return { success: true };
    }),

  listByChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const products = await productRepository.findByChannelId(input.channelId);
      return products.map(mapProductToProductOutboundDto);
    }),

  // Product Images
  addImage: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        url: z.string().url(),
        cloudinaryPublicId: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shopId = await productRepository.getShopId(input.productId);
      if (!shopId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      await requireProductAccess(ctx, shopId);

      const position = await productImageRepository.getNextPosition(
        input.productId,
      );
      const image = await productImageRepository.save(
        input.productId,
        input.url,
        input.cloudinaryPublicId ?? null,
        position,
      );

      // Also set as the product's main image_url if it's the first image
      if (position === 0) {
        await productRepository.updateById(input.productId, {
          image_url: input.url,
        });
      }

      return {
        id: image.id,
        productId: image.product_id,
        url: image.url,
        cloudinaryPublicId: image.cloudinary_public_id,
        position: image.position,
        createdAt: image.created_at,
      };
    }),

  removeImage: protectedProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const image = await productImageRepository.findById(input.imageId);
      if (!image) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Image not found" });
      }

      const shopId = await productRepository.getShopId(image.product_id);
      if (!shopId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      await requireProductAccess(ctx, shopId);

      await productImageRepository.deleteById(input.imageId);

      // Update main image_url: use next image or null
      const remaining = await productImageRepository.findByProductId(
        image.product_id,
      );
      await productRepository.updateById(image.product_id, {
        image_url: remaining.length > 0 ? remaining[0].url : null,
      });

      return { success: true };
    }),

  listImages: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const images = await productImageRepository.findByProductId(
        input.productId,
      );
      return images.map((img) => ({
        id: img.id,
        productId: img.product_id,
        url: img.url,
        cloudinaryPublicId: img.cloudinary_public_id,
        position: img.position,
        createdAt: img.created_at,
      }));
    }),
});

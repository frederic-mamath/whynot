import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { shopRepository, userShopRoleRepository, userRepository } from "../repositories";
import { TRPCError } from "@trpc/server";
import { requireShopOwner, requireShopAccess } from "../middleware/shopOwner";
import { mapShopToShopOutboundDto, mapShopWithRoleToShopWithRoleOutboundDto, mapCreateShopInboundDtoToShop } from "../mappers";

export const shopRouter = router({
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
      await userShopRoleRepository.assignRole(ctx.user.id, shop.id, 'shop-owner');

      return mapShopToShopOutboundDto(shop);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    // Find shops where user has a role using repository
    const results = await shopRepository.findByUserWithRole(ctx.user.id);

    return results.map(r => mapShopWithRoleToShopWithRoleOutboundDto(
      {
        id: r.id,
        name: r.name,
        description: r.description,
        owner_id: r.owner_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
      },
      r.role
    ));
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

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;

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
      const alreadyVendor = await userShopRoleRepository.existsByUserAndShopAndRole(
        input.userId,
        input.shopId,
        'vendor'
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
        'vendor'
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

      await userShopRoleRepository.removeRole(input.userId, input.shopId, 'vendor');

      return { success: true };
    }),

  listVendors: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireShopAccess(ctx, input.shopId);

      const vendors = await userShopRoleRepository.findVendorsByShop(input.shopId);

      return vendors;
    }),
});

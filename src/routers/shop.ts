import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "../db";
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
      
      const shop = await db
        .insertInto("shops")
        .values({
          name: shopData.name,
          description: shopData.description,
          owner_id: shopData.owner_id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await db
        .insertInto("user_shop_roles")
        .values({
          user_id: ctx.user.id,
          shop_id: shop.id,
          role: "shop-owner",
          created_at: new Date(),
        })
        .execute();

      return mapShopToShopOutboundDto(shop);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const results = await db
      .selectFrom("shops")
      .innerJoin("user_shop_roles", "user_shop_roles.shop_id", "shops.id")
      .select([
        "shops.id",
        "shops.name",
        "shops.description",
        "shops.owner_id",
        "shops.created_at",
        "shops.updated_at",
        "user_shop_roles.role",
      ])
      .where("user_shop_roles.user_id", "=", ctx.user.id)
      .execute();

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
      const shop = await db
        .selectFrom("shops")
        .selectAll()
        .where("id", "=", input.shopId)
        .executeTakeFirst();

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

      const updateData: any = {
        updated_at: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;

      const shop = await db
        .updateTable("shops")
        .set(updateData)
        .where("id", "=", input.shopId)
        .returningAll()
        .executeTakeFirst();

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

      await db.deleteFrom("shops").where("id", "=", input.shopId).execute();

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

      const user = await db
        .selectFrom("users")
        .select(["id"])
        .where("id", "=", input.userId)
        .executeTakeFirst();

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const existingRole = await db
        .selectFrom("user_shop_roles")
        .select(["id"])
        .where("user_id", "=", input.userId)
        .where("shop_id", "=", input.shopId)
        .where("role", "=", "vendor")
        .executeTakeFirst();

      if (existingRole) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a vendor for this shop",
        });
      }

      const role = await db
        .insertInto("user_shop_roles")
        .values({
          user_id: input.userId,
          shop_id: input.shopId,
          role: "vendor",
          created_at: new Date(),
        })
        .returning(["id", "user_id", "shop_id", "role", "created_at"])
        .executeTakeFirstOrThrow();

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

      await db
        .deleteFrom("user_shop_roles")
        .where("user_id", "=", input.userId)
        .where("shop_id", "=", input.shopId)
        .where("role", "=", "vendor")
        .execute();

      return { success: true };
    }),

  listVendors: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireShopAccess(ctx, input.shopId);

      const vendors = await db
        .selectFrom("user_shop_roles")
        .innerJoin("users", "users.id", "user_shop_roles.user_id")
        .select([
          "users.id",
          "users.email",
          "users.firstname",
          "users.lastname",
          "user_shop_roles.role",
          "user_shop_roles.created_at as assigned_at",
        ])
        .where("user_shop_roles.shop_id", "=", input.shopId)
        .execute();

      return vendors;
    }),
});

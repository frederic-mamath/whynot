import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { userRepository, roleRepository, userRoleRepository } from "../repositories";
import { db } from "../db";

export const sellerOnboardingRouter = router({
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const [user, onboardingData, sellerRole] = await Promise.all([
      db
        .selectFrom("users")
        .select(["seller_onboarding_step", "accepted_seller_rules_at"])
        .where("id", "=", ctx.userId!)
        .executeTakeFirstOrThrow(),
      db
        .selectFrom("seller_onboarding_data")
        .selectAll()
        .where("user_id", "=", ctx.userId!)
        .executeTakeFirst(),
      db
        .selectFrom("user_roles as ur")
        .innerJoin("roles as r", "ur.role_id", "r.id")
        .select(["ur.activated_at"])
        .where("ur.user_id", "=", ctx.userId!)
        .where("r.name", "=", "SELLER")
        .executeTakeFirst(),
    ]);

    const sellerStatus = !sellerRole
      ? "none"
      : sellerRole.activated_at
        ? "active"
        : "pending";

    return {
      step: user.seller_onboarding_step,
      acceptedRulesAt: user.accepted_seller_rules_at,
      surveyData: onboardingData ?? null,
      sellerStatus: sellerStatus as "none" | "pending" | "active",
    };
  }),

  acceptRules: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db
      .selectFrom("users")
      .select(["seller_onboarding_step"])
      .where("id", "=", ctx.userId!)
      .executeTakeFirstOrThrow();

    if (user.seller_onboarding_step >= 1) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Rules already accepted" });
    }

    await userRepository.updateSellerOnboardingStep(ctx.userId!, 1, {
      accepted_seller_rules_at: new Date(),
    });

    return { success: true, step: 1 };
  }),

  saveCategory: protectedProcedure
    .input(z.object({ category: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, category: input.category })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            category: input.category,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 2);
      return { success: true, step: 2 };
    }),

  saveSubCategory: protectedProcedure
    .input(z.object({ subCategory: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, sub_category: input.subCategory })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            sub_category: input.subCategory,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 3);
      return { success: true, step: 3 };
    }),

  saveSellerType: protectedProcedure
    .input(z.object({ sellerType: z.enum(["individual", "registered_business"]) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, seller_type: input.sellerType })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            seller_type: input.sellerType,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 4);
      return { success: true, step: 4 };
    }),

  saveSellingChannels: protectedProcedure
    .input(z.object({ channels: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, selling_channels: input.channels })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            selling_channels: input.channels,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 5);
      return { success: true, step: 5 };
    }),

  saveMonthlyRevenue: protectedProcedure
    .input(z.object({ range: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, monthly_revenue_range: input.range })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            monthly_revenue_range: input.range,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 6);
      return { success: true, step: 6 };
    }),

  saveItemCount: protectedProcedure
    .input(z.object({ range: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, item_count_range: input.range })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            item_count_range: input.range,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 7);
      return { success: true, step: 7 };
    }),

  saveTeamSize: protectedProcedure
    .input(z.object({ range: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, team_size_range: input.range })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            team_size_range: input.range,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 8);
      return { success: true, step: 8 };
    }),

  saveLiveHours: protectedProcedure
    .input(z.object({ range: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({ user_id: ctx.userId!, live_hours_range: input.range })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            live_hours_range: input.range,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 9);
      return { success: true, step: 9 };
    }),

  saveReturnAddress: protectedProcedure
    .input(
      z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        zipCode: z.string().min(1),
        country: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .insertInto("seller_onboarding_data")
        .values({
          user_id: ctx.userId!,
          return_street: input.street,
          return_city: input.city,
          return_zip_code: input.zipCode,
          return_country: input.country,
        })
        .onConflict((oc) =>
          oc.column("user_id").doUpdateSet({
            return_street: input.street,
            return_city: input.city,
            return_zip_code: input.zipCode,
            return_country: input.country,
            updated_at: new Date(),
          }),
        )
        .execute();
      await userRepository.updateSellerOnboardingStep(ctx.userId!, 10);
      return { success: true, step: 10 };
    }),

  submitApplication: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db
      .selectFrom("users")
      .select(["seller_onboarding_step"])
      .where("id", "=", ctx.userId!)
      .executeTakeFirstOrThrow();

    if (user.seller_onboarding_step < 10) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Complete all steps before submitting",
      });
    }

    const existingRole = await userRoleRepository.findByUserIdAndRoleName(
      ctx.userId!,
      "SELLER",
    );
    if (existingRole) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: existingRole.activated_at
          ? "You are already a seller"
          : "Your seller request is already pending",
      });
    }

    const sellerRole = await roleRepository.findByName("SELLER");
    if (!sellerRole) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "SELLER role not found",
      });
    }

    await userRoleRepository.createUserRole({
      userId: ctx.userId!,
      roleId: sellerRole.id,
    });
    await userRepository.updateSellerOnboardingStep(ctx.userId!, 11);

    return { success: true };
  }),
});

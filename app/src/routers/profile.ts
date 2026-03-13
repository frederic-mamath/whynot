import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { userRepository } from "../repositories/UserRepository";
import { addressRepository } from "../repositories/AddressRepository";
import { cloudinaryService } from "../services/CloudinaryService";
import { TRPCError } from "@trpc/server";

export const profileRouter = router({
  /**
   * Get current user profile with addresses
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await userRepository.findById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const addresses = await addressRepository.findByUserId(ctx.user.id);

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatar_url || null,
      hasCompletedOnboarding: user.has_completed_onboarding,
      firstName: user.first_name || user.firstname || null,
      lastName: user.last_name || user.lastname || null,
      addresses: addresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        street: addr.street,
        street2: addr.street2,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zip_code,
        country: addr.country,
        isDefault: addr.is_default,
        createdAt: addr.created_at,
      })),
    };
  }),

  /**
   * Complete onboarding: set nickname + optional avatar
   */
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        nickname: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-zA-Z0-9_.-]+$/, {
            message: "Nickname can only contain letters, numbers, _ . -",
          }),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check nickname uniqueness (exclude current user)
      const existing = await userRepository.findByNickname(input.nickname);
      if (existing && existing.id !== ctx.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ce pseudo est déjà pris",
        });
      }

      const updated = await userRepository.updateProfile(ctx.user.id, {
        nickname: input.nickname,
        avatar_url: input.avatarUrl ?? null,
        has_completed_onboarding: true,
      });

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return { success: true };
    }),

  /**
   * Update user profile (first name, last name)
   */
  update: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await userRepository.updateProfile(ctx.user.id, {
        firstname: input.firstName,
        lastname: input.lastName,
        first_name: input.firstName,
        last_name: input.lastName,
      });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        success: true,
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.first_name || updated.firstname || null,
          lastName: updated.last_name || updated.lastname || null,
        },
      };
    }),

  /**
   * Update user avatar
   * Deletes the previous Cloudinary image if one exists, then saves the new URL + publicId
   */
  updateAvatar: protectedProcedure
    .input(
      z.object({
        avatarUrl: z.string().url(),
        avatarPublicId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await userRepository.findById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Delete previous Cloudinary image if it exists
      if (user.avatar_public_id) {
        try {
          await cloudinaryService.deleteImage(user.avatar_public_id);
        } catch (err) {
          // Log but don't block — the upload should still proceed
          console.error("Failed to delete old avatar from Cloudinary:", err);
        }
      }

      await userRepository.updateProfile(ctx.user.id, {
        avatar_url: input.avatarUrl,
        avatar_public_id: input.avatarPublicId,
      });

      return { success: true };
    }),

  /**
   * Address management
   */
  addresses: router({
    /**
     * List all addresses for current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const addresses = await addressRepository.findByUserId(ctx.user.id);

      return addresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        street: addr.street,
        street2: addr.street2,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zip_code,
        country: addr.country,
        isDefault: addr.is_default,
        createdAt: addr.created_at,
      }));
    }),

    /**
     * Create new address
     */
    create: protectedProcedure
      .input(
        z.object({
          label: z.string().min(1).max(100),
          street: z.string().min(1).max(255),
          street2: z.string().max(255).optional(),
          city: z.string().min(1).max(100),
          state: z.string().min(1).max(100),
          zipCode: z.string().min(1).max(20),
          country: z.string().length(2).default("US"),
          isDefault: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const address = await addressRepository.create({
          userId: ctx.user.id,
          label: input.label,
          street: input.street,
          street2: input.street2,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          country: input.country,
          isDefault: input.isDefault,
        });

        return {
          success: true,
          address: {
            id: address.id,
            label: address.label,
            street: address.street,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zipCode: address.zip_code,
            country: address.country,
            isDefault: address.is_default,
          },
        };
      }),

    /**
     * Update existing address
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().min(1).max(100).optional(),
          street: z.string().min(1).max(255).optional(),
          street2: z.string().max(255).optional(),
          city: z.string().min(1).max(100).optional(),
          state: z.string().min(1).max(100).optional(),
          zipCode: z.string().min(1).max(20).optional(),
          country: z.string().length(2).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const isOwner = await addressRepository.verifyOwnership(
          input.id,
          ctx.user.id,
        );
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this address",
          });
        }

        const address = await addressRepository.update(input.id, {
          label: input.label,
          street: input.street,
          street2: input.street2,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          country: input.country,
        });

        return {
          success: true,
          address: {
            id: address.id,
            label: address.label,
            street: address.street,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zipCode: address.zip_code,
            country: address.country,
            isDefault: address.is_default,
          },
        };
      }),

    /**
     * Delete address
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const isOwner = await addressRepository.verifyOwnership(
          input.id,
          ctx.user.id,
        );
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to delete this address",
          });
        }

        await addressRepository.delete(input.id);

        return { success: true };
      }),

    /**
     * Set address as default
     */
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const isOwner = await addressRepository.verifyOwnership(
          input.id,
          ctx.user.id,
        );
        if (!isOwner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this address",
          });
        }

        const address = await addressRepository.setDefault(input.id);

        return {
          success: true,
          address: {
            id: address.id,
            isDefault: address.is_default,
          },
        };
      }),
  }),
});

import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { userRepository, authProviderRepository } from "../repositories";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyMergeToken,
} from "../utils/auth";
import { accountMergeService } from "../services/AccountMergeService";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user exists using repository
      const existingUser = await userRepository.findByEmail(input.email);

      if (existingUser) {
        // Check if the existing account is OAuth-only (no password)
        if (!existingUser.password) {
          // Find which providers are linked
          const providers = await authProviderRepository.findByUserId(
            existingUser.id,
          );
          const providerNames = providers.map((p) => p.provider);

          throw new TRPCError({
            code: "CONFLICT",
            message: `oauth_account_exists:${providerNames.join(",")}`,
          });
        }

        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const hashedPassword = await hashPassword(input.password);

      // Create user using repository
      const user = await userRepository.save(input.email, hashedPassword);

      const token = generateToken(user.id);

      // Create session for web clients
      if (ctx.req?.session) {
        ctx.req.session.passport = { user: user.id };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.is_verified,
        },
        token,
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Find user by email using repository
      const user = await userRepository.findByEmail(input.email);

      if (!user || !user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValidPassword = await verifyPassword(
        input.password,
        user.password,
      );

      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = generateToken(user.id);

      // Create session for web clients
      if (ctx.req?.session) {
        ctx.req.session.passport = { user: user.id };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.is_verified,
        },
        token,
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Find user by ID using repository
    const user = await userRepository.findById(ctx.userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      email: user.email,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.req?.session) {
      return new Promise<{ success: boolean }>((resolve, reject) => {
        ctx.req!.session.destroy((err) => {
          if (err) {
            reject(
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to logout",
              }),
            );
          } else {
            resolve({ success: true });
          }
        });
      });
    }
    return { success: true };
  }),

  /**
   * Merge an OAuth provider into existing email/password account.
   * Called from /account-merge page after OAuth detected a conflict.
   * Requires the merge token (from redirect) + the user's password.
   */
  mergeWithPassword: publicProcedure
    .input(
      z.object({
        mergeToken: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const payload = verifyMergeToken(input.mergeToken);
      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired merge token",
        });
      }

      const user = await accountMergeService.mergeOAuthIntoExistingAccount(
        payload.userId,
        input.password,
        payload.provider,
        payload.providerUserId,
        payload.providerEmail,
        payload.firstName,
        payload.lastName,
      );

      const token = generateToken(user.id);

      // Create session
      if (ctx.req?.session) {
        ctx.req.session.passport = { user: user.id };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.is_verified,
        },
        token,
      };
    }),

  /**
   * Add a password to an OAuth-only account.
   * User must be logged in (authenticated via OAuth session).
   */
  addPassword: publicProcedure
    .input(
      z.object({
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const user = await userRepository.findById(ctx.userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account already has a password",
        });
      }

      await accountMergeService.mergeEmailIntoOAuthAccount(
        ctx.userId,
        input.password,
      );

      return { success: true };
    }),
});

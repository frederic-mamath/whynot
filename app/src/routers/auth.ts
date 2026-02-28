import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { userRepository } from '../repositories';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      // Check if user exists using repository
      const emailExists = await userRepository.existsByEmail(input.email);

      if (emailExists) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      const hashedPassword = await hashPassword(input.password);

      // Create user using repository
      const user = await userRepository.save(input.email, hashedPassword);

      const token = generateToken(user.id);

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
      })
    )
    .mutation(async ({ input }) => {
      // Find user by email using repository
      const user = await userRepository.findByEmail(input.email);

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const isValidPassword = await verifyPassword(input.password, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user.id);

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
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    // Find user by ID using repository
    const user = await userRepository.findById(ctx.userId);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      isVerified: user.is_verified,
      createdAt: user.created_at,
    };
  }),
});

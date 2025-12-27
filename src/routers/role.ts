import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { roleRepository, userRoleRepository } from '../repositories';
import { TRPCError } from '@trpc/server';

export const roleRouter = router({
  /**
   * Request SELLER role
   * Creates a pending user_role entry (activated_by = NULL)
   */
  requestSellerRole: publicProcedure
    .mutation(async ({ ctx }) => {
      // Check authentication
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to request seller role',
        });
      }

      // Find SELLER role
      const sellerRole = await roleRepository.findByName('SELLER');
      if (!sellerRole) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'SELLER role not found in database',
        });
      }

      // Check if user already has SELLER role (active or pending)
      const existingRole = await userRoleRepository.findByUserIdAndRoleName(
        ctx.userId,
        'SELLER'
      );

      if (existingRole) {
        if (existingRole.activated_at) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You are already a seller',
          });
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Your seller request is pending approval',
          });
        }
      }

      // Create pending role request
      const roleRequest = await userRoleRepository.createUserRole({
        userId: ctx.userId,
        roleId: sellerRole.id,
        activatedBy: undefined,
        activatedAt: undefined,
      });

      return {
        success: true,
        message: 'Seller role request submitted. Awaiting admin approval.',
        roleRequest: {
          id: roleRequest.id,
          status: 'pending',
          createdAt: roleRequest.created_at,
        },
      };
    }),

  /**
   * Get current user's roles
   */
  myRoles: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      const activeRoles = await userRoleRepository.findActiveRolesByUserId(ctx.userId);

      return {
        roles: activeRoles.map(r => r.role_name),
        details: activeRoles,
      };
    }),

  /**
   * Check if user has a specific role
   */
  hasRole: publicProcedure
    .input(
      z.object({
        roleName: z.enum(['BUYER', 'SELLER']),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        return { hasRole: false };
      }

      const hasRole = await userRoleRepository.hasActiveRole(
        ctx.userId,
        input.roleName
      );

      return { hasRole };
    }),
});

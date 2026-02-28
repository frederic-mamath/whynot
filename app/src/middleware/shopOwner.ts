import { TRPCError } from '@trpc/server';
import { Context } from '../types/context';
import { userShopRoleRepository } from '../repositories';

export async function requireShopOwner(
  ctx: Context,
  shopId: number
): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  const isOwner = await userShopRoleRepository.isShopOwner(ctx.user.id, shopId);

  if (!isOwner) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only shop owners can perform this action',
    });
  }
}

export async function requireShopAccess(
  ctx: Context,
  shopId: number
): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  const hasAccess = await userShopRoleRepository.hasShopAccess(ctx.user.id, shopId);

  if (!hasAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this shop',
    });
  }
}

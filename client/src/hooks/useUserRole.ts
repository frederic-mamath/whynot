import { trpc } from '../lib/trpc';

/**
 * Hook to get current user's role information
 * Used to determine if user can publish video/audio in channels
 */
export function useUserRole() {
  const { data: rolesData, isLoading } = trpc.role.myRoles.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Check if user has SELLER role (active)
  const isSeller = rolesData?.roles.includes('SELLER') ?? false;
  
  // Everyone is a buyer by default, sellers can also buy
  const isBuyer = true;
  
  // Determine primary role (for display purposes)
  const primaryRole = isSeller ? 'seller' : 'buyer';
  
  // Only sellers can publish video/audio streams
  const canPublish = isSeller;

  return {
    role: primaryRole,
    roles: rolesData?.roles ?? [],
    isSeller,
    isBuyer,
    canPublish,
    isLoading,
  };
}

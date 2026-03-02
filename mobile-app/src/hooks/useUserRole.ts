import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "SELLER" | "BUYER";

export function useUserRole() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, refetch } = trpc.role.myRoles.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const roles: UserRole[] = (data?.roles ?? []) as UserRole[];

  return {
    roles,
    isSeller: roles.includes("SELLER"),
    isBuyer: roles.includes("BUYER"),
    isLoading,
    refetch,
    details: data?.details ?? [],
  };
}

import { trpc } from "@/lib/trpc";

export function useSellersPage() {
  const { data: sellers, isLoading } = trpc.shop.listAllSellers.useQuery();
  return { sellers, isLoading };
}

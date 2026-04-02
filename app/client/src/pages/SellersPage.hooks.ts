import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function useSellersPage() {
  const utils = trpc.useUtils();
  const { data: sellers, isLoading } = trpc.shop.listAllSellers.useQuery();

  const [pendingUnfollowId, setPendingUnfollowId] = useState<number | null>(
    null,
  );

  const followSeller = trpc.shop.followSeller.useMutation({
    onSuccess: () => utils.shop.listAllSellers.invalidate(),
  });

  const unfollowSeller = trpc.shop.unfollowSeller.useMutation({
    onSuccess: () => {
      utils.shop.listAllSellers.invalidate();
      setPendingUnfollowId(null);
    },
  });

  return {
    sellers,
    isLoading,
    followSeller: (sellerId: number) => followSeller.mutate({ sellerId }),
    unfollowSeller: (sellerId: number) => unfollowSeller.mutate({ sellerId }),
    pendingUnfollowId,
    setPendingUnfollowId,
  };
}

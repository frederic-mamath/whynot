import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function useSellersPage() {
  const utils = trpc.useUtils();
  const { data: sellers, isLoading } = trpc.shop.listAllSellers.useQuery();

  const [pendingUnfollowId, setPendingUnfollowId] = useState<number | null>(
    null,
  );

  const followSeller = trpc.shop.followSeller.useMutation({
    onSuccess: (_, input) => {
      utils.shop.listAllSellers.setData(undefined, (old) =>
        old
          ? old.map((s) =>
              s.userId === input.sellerId ? { ...s, isFollowed: true } : s,
            )
          : old,
      );
      utils.shop.listAllSellers.invalidate();
    },
  });

  const unfollowSeller = trpc.shop.unfollowSeller.useMutation({
    onSuccess: (_, input) => {
      utils.shop.listAllSellers.setData(undefined, (old) =>
        old
          ? old.map((s) =>
              s.userId === input.sellerId ? { ...s, isFollowed: false } : s,
            )
          : old,
      );
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

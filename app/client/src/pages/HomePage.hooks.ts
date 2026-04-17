import { useState } from "react";
import posthog from "posthog-js";
import { trpc } from "@/lib/trpc";

export function useHomePage() {
  const utils = trpc.useUtils();
  const { data: sellersData, isLoading } = trpc.shop.listSellers.useQuery({
    limit: 10,
  });
  const { data: nextLive, isLoading: isNextLiveLoading } =
    trpc.live.nextScheduled.useQuery();
  const { data: livesData, isLoading: isActiveLivesLoading } =
    trpc.live.list.useQuery({ limit: 4 });

  const [pendingUnfollowId, setPendingUnfollowId] = useState<number | null>(
    null,
  );

  const followSeller = trpc.shop.followSeller.useMutation({
    onSuccess: (_, variables) => {
      utils.shop.listSellers.invalidate();
      posthog.capture("seller_followed", { seller_id: variables.sellerId });
    },
  });

  const unfollowSeller = trpc.shop.unfollowSeller.useMutation({
    onSuccess: () => {
      utils.shop.listSellers.invalidate();
      setPendingUnfollowId(null);
    },
  });

  return {
    sellers: sellersData?.sellers,
    hasMoreSellers: sellersData?.hasMore ?? false,
    isLoading,
    nextLive,
    isNextLiveLoading,
    activeLives: livesData?.lives,
    hasMoreLives: livesData?.hasMore ?? false,
    isActiveLivesLoading,
    followSeller: (sellerId: number) => followSeller.mutate({ sellerId }),
    unfollowSeller: (sellerId: number) =>
      unfollowSeller.mutate({ sellerId }),
    pendingUnfollowId,
    setPendingUnfollowId,
  };
}

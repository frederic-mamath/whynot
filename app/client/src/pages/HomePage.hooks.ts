import { trpc } from "@/lib/trpc";

export function useHomePage() {
  const { data: sellersData, isLoading } = trpc.shop.listSellers.useQuery({
    limit: 10,
  });
  const { data: nextLive, isLoading: isNextLiveLoading } =
    trpc.live.nextScheduled.useQuery();
  const { data: livesData, isLoading: isActiveLivesLoading } =
    trpc.live.list.useQuery({ limit: 4 });

  return {
    sellers: sellersData?.sellers,
    hasMoreSellers: sellersData?.hasMore ?? false,
    isLoading,
    nextLive,
    isNextLiveLoading,
    activeLives: livesData?.lives,
    hasMoreLives: livesData?.hasMore ?? false,
    isActiveLivesLoading,
  };
}

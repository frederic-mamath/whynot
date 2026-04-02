import { trpc } from "@/lib/trpc";

export function useHomePage() {
  const { data: sellers, isLoading } = trpc.shop.listSellers.useQuery();
  const { data: nextLive, isLoading: isNextLiveLoading } =
    trpc.live.nextScheduled.useQuery();
  const { data: activeLives, isLoading: isActiveLivesLoading } =
    trpc.live.list.useQuery();

  return {
    sellers,
    isLoading,
    nextLive,
    isNextLiveLoading,
    activeLives,
    isActiveLivesLoading,
  };
}

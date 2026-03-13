import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LiveHighlight } from "@/components/LiveHighlight";

// Deterministic color from nickname string
function avatarColor(nickname: string): string {
  const colors = [
    "bg-rose-500",
    "bg-pink-500",
    "bg-fuchsia-500",
    "bg-violet-500",
    "bg-indigo-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
  ];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function HomePage() {
  const { data: sellers, isLoading } = trpc.shop.listSellers.useQuery();
  const { data: nextLive, isLoading: isNextLiveLoading } =
    trpc.live.nextScheduled.useQuery();

  return (
    <div className="min-h-screen bg-background px-4 pt-10 pb-6 space-y-6">
      {/* Next live highlight */}
      <LiveHighlight live={nextLive} isLoading={isNextLiveLoading} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-outfit font-black tracking-widest uppercase text-foreground">
          Premiers vendeurs
        </span>
        <button className="text-xs font-outfit text-primary hover:underline">
          Voir tout →
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border border-border rounded-xl px-4 py-4"
              >
                <Skeleton className="size-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))
          : sellers?.map((seller) => (
              <div
                key={seller.shopId}
                className="flex items-center gap-4 border border-border rounded-xl px-4 py-4"
              >
                {/* Avatar */}
                {seller.avatarUrl ? (
                  <img
                    src={seller.avatarUrl}
                    alt={seller.nickname}
                    className="size-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={cn(
                      "size-12 rounded-full flex items-center justify-center shrink-0 text-white font-outfit font-black text-lg uppercase",
                      avatarColor(seller.nickname),
                    )}
                  >
                    {seller.nickname[0]}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-outfit font-bold text-sm text-foreground truncate">
                    {seller.nickname}
                  </p>
                  {seller.topCategories.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {seller.topCategories.map((c) => `${c.name}`).join(" · ")}
                    </p>
                  )}
                </div>

                {/* Follow button (placeholder) */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full shrink-0 text-xs font-outfit font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Suivre
                </Button>
              </div>
            ))}

        {!isLoading && sellers?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Aucun vendeur pour l'instant.
          </div>
        )}
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LiveHighlight } from "@/components/LiveHighlight";
import { Users } from "lucide-react";

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
  const navigate = useNavigate();
  const { data: sellers, isLoading } = trpc.shop.listSellers.useQuery();
  const { data: nextLive, isLoading: isNextLiveLoading } =
    trpc.live.nextScheduled.useQuery();
  const { data: activeLives, isLoading: isActiveLivesLoading } =
    trpc.live.list.useQuery();

  return (
    <div className="min-h-screen bg-background px-4 pt-10 pb-6 space-y-6">
      {/* Next live highlight */}
      <LiveHighlight live={nextLive} isLoading={isNextLiveLoading} />

      {/* Active lives section */}
      {(isActiveLivesLoading || (activeLives && activeLives.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-outfit font-black tracking-widest uppercase text-foreground">
              En direct maintenant
            </span>
          </div>
          <div className="space-y-3">
            {isActiveLivesLoading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))
              : activeLives?.map((live) => {
                  const bg = live.cover_url ?? live.host_avatar_url;
                  return (
                    <div
                      key={live.id}
                      className="relative h-28 rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/live/${live.id}`)}
                    >
                      {/* Background */}
                      {bg ? (
                        <img
                          src={bg}
                          alt={live.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600" />
                      )}
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/50" />
                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-between p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-outfit font-bold px-2 py-0.5 rounded-full">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            EN DIRECT
                          </span>
                          <span className="flex items-center gap-1 text-white/80 text-xs font-outfit">
                            <Users className="size-3" />
                            {live.participantCount}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-syne font-bold text-white text-sm leading-tight line-clamp-1">
                            {live.name}
                          </p>
                          <p className="text-white/70 text-xs font-outfit">
                            {live.host_nickname}
                          </p>
                        </div>
                      </div>
                      {/* Join button */}
                      <button
                        className="absolute right-4 bottom-4 bg-primary text-primary-foreground text-xs font-outfit font-semibold px-3 py-1.5 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/live/${live.id}`);
                        }}
                      >
                        Rejoindre
                      </button>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

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

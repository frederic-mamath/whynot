import { Skeleton } from "@/components/ui/skeleton";
import { useSellersPage } from "./SellersPage.hooks";

export default function SellersPage() {
  const { sellers, isLoading } = useSellersPage();

  return (
    <div className="min-h-screen bg-background px-4 pt-10 space-y-6">
      <h1 className="text-xs font-outfit font-black tracking-widest uppercase text-foreground">
        Vendeurs
      </h1>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border border-border rounded-xl px-4 py-4"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            ))
          : sellers?.map((seller) => (
              <div
                key={seller.userId}
                className="flex items-center gap-4 border border-border rounded-xl px-4 py-4"
              >
                <p className="flex-1 font-outfit font-bold text-sm text-foreground truncate">
                  {seller.nickname}
                </p>

                <div className="relative group">
                  <button
                    disabled
                    className="text-xs font-outfit font-semibold border border-border text-muted-foreground rounded-full px-4 py-2 cursor-not-allowed"
                  >
                    Contacter
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-outfit bg-card text-foreground border border-border rounded-lg whitespace-nowrap invisible group-hover:visible transition-all">
                    Bientôt disponible...
                  </span>
                </div>

                <div className="relative group">
                  <button
                    disabled
                    className="text-xs font-outfit font-semibold border border-border text-muted-foreground rounded-full px-4 py-2 cursor-not-allowed"
                  >
                    Suivre
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-outfit bg-card text-foreground border border-border rounded-lg whitespace-nowrap invisible group-hover:visible transition-all">
                    Bientôt disponible...
                  </span>
                </div>
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

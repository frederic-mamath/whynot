import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { useLivesPage } from "./LivesPage.hooks";

export default function LivesPage() {
  const {
    filteredLives,
    isLoading,
    allCategories,
    selectedCategories,
    setSelectedCategories,
    sort,
    setSort,
  } = useLivesPage();

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pt-10 space-y-6">
      <h1 className="text-xs font-outfit font-black tracking-widest uppercase text-foreground">
        Lives
      </h1>

      {/* Filter + sort bar */}
      {(allCategories.length > 0 || !isLoading) && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Category chips */}
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={cn(
                "shrink-0 text-xs font-outfit font-semibold px-3 py-1.5 rounded-full border transition-colors",
                selectedCategories.includes(cat)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-foreground border-border",
              )}
            >
              {cat}
            </button>
          ))}

          {/* Divider if both categories and sort chips */}
          {allCategories.length > 0 && (
            <div className="shrink-0 h-5 w-px bg-border mx-1" />
          )}

          {/* Sort chips */}
          <button
            onClick={() => setSort("date")}
            className={cn(
              "shrink-0 text-xs font-outfit font-semibold px-3 py-1.5 rounded-full border transition-colors",
              sort === "date"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-foreground border-border",
            )}
          >
            Date
          </button>
          <button
            onClick={() => setSort("name")}
            className={cn(
              "shrink-0 text-xs font-outfit font-semibold px-3 py-1.5 rounded-full border transition-colors",
              sort === "name"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-foreground border-border",
            )}
          >
            Nom
          </button>
        </div>
      )}

      {/* Lives list */}
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))
          : filteredLives.map((live) => (
              <Link to={`/live/${live.id}`} key={live.id}>
                <div className="relative h-28 rounded-2xl overflow-hidden cursor-pointer">
                  {/* Background */}
                  {live.cover_url ? (
                    <img
                      src={live.cover_url}
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
                      {live.isActive ? (
                        <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-outfit font-bold px-2 py-0.5 rounded-full">
                          <span className="size-1.5 rounded-full bg-white animate-pulse" />
                          EN DIRECT
                        </span>
                      ) : (
                        <span className="text-white/70 text-[10px] font-outfit">
                          {new Date(live.starts_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {live.isActive && (
                        <span className="flex items-center gap-1 text-white/80 text-xs font-outfit">
                          <Users className="size-3" />
                          {live.participantCount}
                        </span>
                      )}
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
                  {/* CTA button */}
                  <button className="absolute right-4 bottom-4 bg-primary text-primary-foreground text-xs font-outfit font-semibold px-3 py-1.5 rounded-full cursor-pointer">
                    {live.isActive ? "Rejoindre" : "Voir"}
                  </button>
                </div>
              </Link>
            ))}

        {!isLoading && filteredLives.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Aucun live pour l'instant.
          </div>
        )}
      </div>
    </div>
  );
}

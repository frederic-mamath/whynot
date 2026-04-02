import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export type SortType = "name" | "date";

export function useLivesPage() {
  const { data: lives, isLoading } = trpc.live.listDiscovery.useQuery();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortType>("date");

  const allCategories = useMemo(() => {
    if (!lives) return [];
    const cats = new Set<string>();
    for (const live of lives) {
      for (const cat of live.categories) {
        cats.add(cat);
      }
    }
    return Array.from(cats).sort();
  }, [lives]);

  const filteredLives = useMemo(() => {
    if (!lives) return [];

    let result = lives;

    if (selectedCategories.length > 0) {
      result = result.filter((live) =>
        live.categories.some((cat) => selectedCategories.includes(cat)),
      );
    }

    return [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return (
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    });
  }, [lives, selectedCategories, sort]);

  return {
    filteredLives,
    isLoading,
    allCategories,
    selectedCategories,
    setSelectedCategories,
    sort,
    setSort,
  };
}

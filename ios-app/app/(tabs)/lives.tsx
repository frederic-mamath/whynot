import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { LiveCard } from "@/components/LiveCard";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

const ALL = "Tous";

export default function LivesScreen() {
  const utils = trpc.useUtils();
  const [selectedCategory, setSelectedCategory] = useState(ALL);

  const { data, isLoading, isFetching } = trpc.live.listDiscovery.useQuery();

  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: L3 follow-up (wrap in useMemo to stabilize reference)
  const lives = data ?? [];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const live of lives) {
      for (const cat of live.categories) cats.add(cat);
    }
    return [ALL, ...Array.from(cats).sort()];
  }, [lives]);

  const filtered = useMemo(() => {
    if (selectedCategory === ALL) return lives;
    return lives.filter((l) => l.categories.includes(selectedCategory));
  }, [lives, selectedCategory]);

  const onRefresh = () => utils.live.listDiscovery.invalidate();

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Lives</Text>

      {/* Category chips */}
      <FlatList
        data={categories}
        keyExtractor={(c) => c}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.chip,
              item === selectedCategory && styles.chipActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.chipText,
                item === selectedCategory && styles.chipTextActive,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Lives grid */}
      <FlatList
        data={filtered}
        keyExtractor={(l) => String(l.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {selectedCategory === ALL
                  ? "Aucun live pour le moment"
                  : `Aucun live en ${selectedCategory}`}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <LiveCard
              live={{
                id: item.id,
                name: item.name,
                coverUrl: item.cover_url ?? null,
                hostNickname: item.host_nickname,
                participantCount: item.participantCount,
                isActive: item.isActive,
              }}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  pageTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.foreground,
    paddingHorizontal: Spacing.lg,
    marginBottom: 16,
  },
  chipsScroll: {
    flexShrink: 0,
    flexGrow: 0,
    marginBottom: 16,
  },
  chips: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius["2xl"],
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.foreground,
    fontWeight: "500",
  },
  chipTextActive: {
    color: Colors.primaryForeground,
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 24,
    gap: 8,
  },
  row: {
    gap: 8,
  },
  gridItem: {
    flex: 1,
    maxWidth: "50%",
  },
  empty: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
});

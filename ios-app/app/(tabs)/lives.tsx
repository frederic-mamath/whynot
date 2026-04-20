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

const ALL = "Tous";

export default function LivesScreen() {
  const utils = trpc.useUtils();
  const [selectedCategory, setSelectedCategory] = useState(ALL);

  const { data, isLoading, isFetching } = trpc.live.listDiscovery.useQuery();

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
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  chipText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: 12,
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
    fontSize: 15,
    color: "#6B7280",
  },
});

import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  StyleSheet,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { LiveCard } from "@/components/LiveCard";

export default function HomeScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const livesQuery = trpc.live.list.useQuery({ limit: 4 });
  const nextQuery = trpc.live.nextScheduled.useQuery();
  const sellersQuery = trpc.shop.listSellers.useQuery({ limit: 6 });

  const isRefreshing =
    livesQuery.isFetching || nextQuery.isFetching || sellersQuery.isFetching;

  const onRefresh = async () => {
    await Promise.all([
      utils.live.list.invalidate(),
      utils.live.nextScheduled.invalidate(),
      utils.shop.listSellers.invalidate(),
    ]);
  };

  const lives = livesQuery.data?.lives ?? [];
  const next = nextQuery.data;
  const sellers = sellersQuery.data?.sellers ?? [];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.pageTitle}>Popup</Text>

      {/* Next scheduled live banner */}
      {lives.length === 0 && next && (
        <Pressable
          style={styles.nextBanner}
          onPress={() => router.push(`/live/${next.id}`)}
        >
          {next.coverUrl ? (
            <Image source={{ uri: next.coverUrl }} style={styles.nextCover} />
          ) : (
            <View style={[styles.nextCover, styles.nextCoverPlaceholder]} />
          )}
          <View style={styles.nextInfo}>
            <Text style={styles.nextLabel}>Prochain live</Text>
            <Text style={styles.nextName} numberOfLines={1}>
              {next.name}
            </Text>
            <Text style={styles.nextTime}>
              {formatDate(next.startsAt)} à {formatTime(next.startsAt)}
            </Text>
            <Text style={styles.nextHost}>@{next.host.nickname}</Text>
          </View>
        </Pressable>
      )}

      {/* Active lives grid */}
      {lives.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>En direct</Text>
          <View style={styles.liveGrid}>
            {lives.map((live) => (
              <View key={live.id} style={styles.liveGridItem}>
                <LiveCard
                  live={{
                    id: live.id,
                    name: live.name,
                    coverUrl: live.cover_url ?? null,
                    hostNickname: live.host_nickname,
                    participantCount: live.participantCount,
                    isActive: true,
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No lives + no next */}
      {lives.length === 0 && !next && !livesQuery.isLoading && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun live pour le moment</Text>
          <Text style={styles.emptySubtext}>
            Revenez bientôt pour découvrir les prochains lives
          </Text>
        </View>
      )}

      {/* Sellers row */}
      {sellers.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Vendeurs</Text>
          <FlatList
            data={sellers}
            keyExtractor={(s) => String(s.userId)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sellersList}
            renderItem={({ item }) => (
              <View style={styles.sellerItem}>
                {item.avatarUrl ? (
                  <Image
                    source={{ uri: item.avatarUrl }}
                    style={styles.sellerAvatar}
                  />
                ) : (
                  <View style={[styles.sellerAvatar, styles.sellerAvatarFallback]}>
                    <Text style={styles.sellerAvatarInitial}>
                      {(item.nickname ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.sellerName} numberOfLines={1}>
                  @{item.nickname}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingTop: 60,
    paddingBottom: 24,
    gap: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#7C3AED",
    paddingHorizontal: 16,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  liveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  liveGridItem: {
    width: "47%",
  },
  nextBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  nextCover: {
    width: 80,
    height: 100,
  },
  nextCoverPlaceholder: {
    backgroundColor: "#E5E7EB",
  },
  nextInfo: {
    flex: 1,
    padding: 12,
    gap: 2,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nextName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  nextTime: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  nextHost: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  sellersList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  sellerItem: {
    alignItems: "center",
    gap: 6,
    width: 64,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  sellerAvatarFallback: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarInitial: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6B7280",
  },
  sellerName: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
  },
});

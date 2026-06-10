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
import { useRefreshControl } from "@/hooks/useRefreshControl";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const livesQuery = trpc.live.list.useQuery({ limit: 4 });
  const nextQuery = trpc.live.nextScheduled.useQuery();
  const sellersQuery = trpc.shop.listSellers.useQuery({ limit: 6 });

  const { refreshing, onRefresh } = useRefreshControl({
    refetch: () =>
      Promise.all([
        utils.live.list.invalidate(),
        utils.live.nextScheduled.invalidate(),
        utils.shop.listSellers.invalidate(),
      ]),
  });

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 24,
    gap: 24,
  },
  pageTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.primary,
    paddingHorizontal: Spacing.lg,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.foreground,
    paddingHorizontal: Spacing.lg,
    marginBottom: 12,
  },
  liveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  liveGridItem: {
    width: "47%",
  },
  nextBanner: {
    marginHorizontal: 16,
    borderRadius: Radius["2xl"],
    overflow: "hidden",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  nextCover: {
    width: 80,
    height: 100,
  },
  nextCoverPlaceholder: {
    backgroundColor: Colors.muted,
  },
  nextInfo: {
    flex: 1,
    padding: Spacing.md,
    gap: 2,
  },
  nextLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nextName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  nextTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  nextHost: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    textAlign: "center",
  },
  sellersList: {
    paddingHorizontal: Spacing.lg,
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
    borderRadius: Radius["4xl"],
  },
  sellerAvatarFallback: {
    backgroundColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarInitial: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "600",
    color: Colors.mutedForeground,
  },
  sellerName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
    textAlign: "center",
  },
});

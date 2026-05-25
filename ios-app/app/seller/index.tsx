import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Package, Radio, Truck } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

export default function SellerDashboardScreen() {
  const router = useRouter();

  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;

  const productsQuery = trpc.product.list.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: shopId !== undefined },
  );
  const livesQuery = trpc.live.listByHost.useQuery();
  const deliveriesQuery = trpc.order.getPendingDeliveries.useQuery();

  if (shopQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const productCount = productsQuery.data?.length ?? 0;
  const upcomingCount = livesQuery.data?.upcoming.length ?? 0;
  const deliveriesCount = deliveriesQuery.data?.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Mon espace vendeur</Text>
          <Text style={styles.shopName}>{shopQuery.data?.name}</Text>
        </View>

        <View style={styles.cards}>
          <DashboardCard
            icon={<Package size={24} color={Colors.primary} />}
            title="Inventaire"
            count={productCount}
            onPress={() => router.push("/seller/products")}
          />
          <DashboardCard
            icon={<Radio size={24} color={Colors.primary} />}
            title="Lives"
            count={upcomingCount}
            onPress={() => router.push("/seller/lives")}
          />
          <DashboardCard
            icon={<Truck size={24} color={Colors.primary} />}
            title="Livraisons"
            count={deliveriesCount}
            onPress={() => router.push("/seller/deliveries")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardCard({
  icon,
  title,
  count,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.xs,
  },
  eyebrow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: "500",
  },
  shopName: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground,
  },
  cards: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  badge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.mutedForeground,
  },
});

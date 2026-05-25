import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

export default function SellerProductsScreen() {
  const router = useRouter();

  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;

  const productsQuery = trpc.product.list.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: shopId !== undefined },
  );

  const products = productsQuery.data ?? [];
  const isLoading = shopQuery.isLoading || productsQuery.isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Inventaire</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Aucun produit — ajoutez votre premier article
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]} />
              )}
              <View style={styles.rowInfo}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.wishedPrice != null && (
                  <Text style={styles.price}>
                    {item.wishedPrice.toFixed(2)} €
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.badge,
                  item.isActive ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.isActive
                      ? styles.badgeTextActive
                      : styles.badgeTextInactive,
                  ]}
                >
                  {item.isActive ? "Actif" : "Inactif"}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push("/seller/products/new")}
      >
        <Plus size={24} color={Colors.primaryForeground} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  back: { padding: Spacing.xs },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  thumbFallback: {
    backgroundColor: Colors.muted,
  },
  rowInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  price: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  badgeActive: { backgroundColor: Colors.accent },
  badgeInactive: { backgroundColor: Colors.muted },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
  },
  badgeTextActive: { color: Colors.accentForeground },
  badgeTextInactive: { color: Colors.mutedForeground },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabPressed: { opacity: 0.85 },
});

import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, Typography } from "@/theme/tokens";
import { LiveProductCard } from "./LiveProductCard";

type Product = {
  id: number;
  name: string;
  imageUrl?: string | null;
  price?: number | null;
  wishedPrice?: number | null;
  interestedCount: number;
  isInterestedByCurrentUser: boolean;
};

type Props = {
  products: Product[];
  isLoading: boolean;
  isSellerView: boolean;
  onToggleInterest?: (productId: number, opts: { onError: () => void }) => void;
};

/**
 * Product lineup shown on page 2 of the live screen.
 *
 * Rendered with a plain ScrollView + .map() rather than a FlatList. The parent
 * is a paged ScrollView (`app/live/[liveId].tsx`), and nesting a vertical
 * VirtualizedList inside a vertical ScrollView triggers the
 * "VirtualizedLists should never be nested in ScrollViews with the same
 * orientation" warning — windowing is defeated by the unbounded outer height,
 * so virtualization buys nothing. Product counts per live are small, so a
 * non-virtualized list is fine.
 */
export function LiveProductList({
  products,
  isLoading,
  isSellerView,
  onToggleInterest,
}: Props) {
  // Page 2 of the live's vertical pager sits at screen y=0 — its top would
  // render under the status bar / dynamic island without this. The parent
  // (app/live/[liveId].tsx) can't grow a top inset itself because page 1 needs
  // to stay full-bleed for the video, so the inset has to live here.
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}>
        <Text style={styles.title}>Produits du live</Text>
        <Text style={styles.count}>
          {products.length} produit{products.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Aucun produit n'a encore été ajouté à ce live
          </Text>
        </View>
      ) : (
        products.map((item) => (
          <LiveProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            imageUrl={item.imageUrl}
            price={item.price}
            wishedPrice={item.wishedPrice}
            interestedCount={item.interestedCount}
            isInterested={item.isInterestedByCurrentUser}
            isSellerView={isSellerView}
            onToggleInterest={
              onToggleInterest
                ? (opts) => onToggleInterest(item.id, opts)
                : undefined
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.foreground,
  },
  count: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  empty: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
});

import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
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

export function LiveProductList({
  products,
  isLoading,
  isSellerView,
  onToggleInterest,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Produits du live</Text>
          <Text style={styles.count}>{products.length} produit{products.length !== 1 ? "s" : ""}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Aucun produit n'a encore été ajouté à ce live
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <LiveProductCard
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
      )}
    />
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

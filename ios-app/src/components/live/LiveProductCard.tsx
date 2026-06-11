import { useEffect, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

type Props = {
  id: number;
  name: string;
  imageUrl?: string | null;
  price?: number | null;
  wishedPrice?: number | null;
  interestedCount: number;
  isInterested: boolean;
  isSellerView: boolean;
  onToggleInterest?: (opts: { onError: () => void }) => void;
};

export function LiveProductCard({
  name,
  imageUrl,
  wishedPrice,
  price,
  interestedCount,
  isInterested,
  isSellerView,
  onToggleInterest,
}: Props) {
  const [optimisticCount, setOptimisticCount] = useState(interestedCount);
  const [optimisticInterested, setOptimisticInterested] = useState(isInterested);

  useEffect(() => {
    setOptimisticCount(interestedCount);
    setOptimisticInterested(isInterested);
  }, [interestedCount, isInterested]);

  const handleToggle = () => {
    const prev = { count: optimisticCount, interested: optimisticInterested };
    setOptimisticCount((c) => (optimisticInterested ? c - 1 : c + 1));
    setOptimisticInterested((v) => !v);
    onToggleInterest?.({
      onError: () => {
        setOptimisticCount(prev.count);
        setOptimisticInterested(prev.interested);
      },
    });
  };

  const displayPrice = wishedPrice ?? price;

  return (
    <View style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {displayPrice != null && (
          <Text style={styles.price}>{displayPrice.toFixed(2)} €</Text>
        )}
      </View>

      <View style={styles.interestArea}>
        <Text style={styles.interestCount}>{optimisticCount}</Text>
        {!isSellerView && (
          <Pressable
            style={[
              styles.interestButton,
              optimisticInterested && styles.interestButtonActive,
            ]}
            onPress={handleToggle}
          >
            <Text style={styles.interestIcon}>✋</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  imageFallback: {
    backgroundColor: Colors.muted,
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  price: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: "500",
  },
  interestArea: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  interestCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: "600",
    textAlign: "center",
  },
  interestButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  interestButtonActive: {
    backgroundColor: Colors.primary,
  },
  interestIcon: {
    fontSize: Typography.fontSize.lg,
  },
});

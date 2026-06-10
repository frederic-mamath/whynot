import { View, Text, Image, StyleSheet } from "react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type Props = { product: Product | null };

export function HighlightedProduct({ product }: Props) {
  if (!product) return null;

  return (
    <View style={styles.card}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.info}>
        <Text style={styles.label}>EN VENTE</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{product.price.toFixed(2)} €</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    top: 110,
    left: 16,
    right: 16,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  image: {
    width: 72,
    height: 72,
  },
  imageFallback: {
    backgroundColor: Colors.muted,
  },
  info: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    color: Colors.accentForeground,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  price: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.foreground,
    marginTop: 2,
  },
});

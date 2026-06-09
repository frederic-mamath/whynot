import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Product = { id: number; name: string; imageUrl: string | null };

type Props = {
  products: Product[];
  onRemove: (productId: number) => void;
};

export function AttachedProductsList({ products, onRemove }: Props) {
  if (products.length === 0) {
    return <Text style={styles.empty}>Aucun produit attaché à ce live</Text>;
  }

  return (
    <>
      {products.map((p) => (
        <View key={p.id} style={styles.row}>
          {p.imageUrl ? (
            <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]} />
          )}
          <Text style={styles.name} numberOfLines={1}>
            {p.name}
          </Text>
          <Pressable
            onPress={() => onRemove(p.id)}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <X size={20} color={Colors.mutedForeground} />
          </Pressable>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: { width: 48, height: 48, borderRadius: Radius.sm },
  thumbFallback: { backgroundColor: Colors.muted },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    fontWeight: "500",
  },
  pressed: { opacity: 0.6 },
});

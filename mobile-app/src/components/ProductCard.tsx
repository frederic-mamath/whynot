import { View, Text, Pressable, Image } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Package, ChevronRight } from "lucide-react-native";

interface ProductCardProps {
  id: number;
  name: string;
  price?: number | null;
  imageUrl?: string | null;
  isActive?: boolean;
  onPress: (id: number) => void;
}

export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  isActive = true,
  onPress,
}: ProductCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(id)}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Package size={24} color={styles.placeholderIcon.color} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {price != null ? (
          <Text style={styles.price}>{price.toFixed(2)} €</Text>
        ) : (
          <Text style={styles.noPrice}>No price set</Text>
        )}
        {!isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inactive</Text>
          </View>
        )}
      </View>

      <ChevronRight size={20} color={styles.chevron.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    color: theme.colors.mutedForeground,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  price: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  noPrice: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    fontStyle: "italic",
  },
  inactiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(229, 72, 77, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radius.full,
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.destructive,
  },
  chevron: {
    color: theme.colors.mutedForeground,
  },
}));

import { View, Text, Pressable, Image } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Package } from "lucide-react-native";

interface OrderCardProps {
  id: string;
  productName: string;
  productImageUrl: string | null;
  finalPrice: number;
  paymentStatus: string;
  createdAt: string;
  onPress?: (id: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(234, 179, 8, 0.12)", text: "#ca8a04" },
  paid: { bg: "rgba(34, 197, 94, 0.12)", text: "#16a34a" },
  shipped: { bg: "rgba(59, 130, 246, 0.12)", text: "#2563eb" },
  failed: { bg: "rgba(239, 68, 68, 0.12)", text: "#dc2626" },
  refunded: { bg: "rgba(156, 163, 175, 0.12)", text: "#6b7280" },
};

export function OrderCard({
  id,
  productName,
  productImageUrl,
  finalPrice,
  paymentStatus,
  createdAt,
  onPress,
}: OrderCardProps) {
  const statusStyle = STATUS_COLORS[paymentStatus] ?? STATUS_COLORS.pending;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && onPress && styles.cardPressed,
      ]}
      onPress={() => onPress?.(id)}
      disabled={!onPress}
    >
      {productImageUrl ? (
        <Image source={{ uri: productImageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Package
            size={24}
            color={styles.placeholderIcon.color}
            strokeWidth={1.5}
          />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>
        <Text style={styles.price}>€{finalPrice.toFixed(2)}</Text>
        <Text style={styles.date}>
          {new Date(createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {paymentStatus.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
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
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    color: theme.colors.mutedForeground,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  price: {
    fontSize: theme.fontSize.base,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
}));

import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Order = {
  id: string;
  productName: string;
  finalPrice: number;
  paymentStatus: "pending" | "paid" | "shipped" | "failed" | "refunded";
  paymentDeadline: string;
  shippedAt: string | null;
};

type Props = {
  order: Order;
  onPayNow: (orderId: string) => void;
  isPaying: boolean;
};

const STATUS_LABEL: Record<Order["paymentStatus"], string> = {
  pending: "En attente de paiement",
  paid: "Payé",
  shipped: "Expédié",
  failed: "Échoué",
  refunded: "Remboursé",
};

const STATUS_COLOR: Record<Order["paymentStatus"], string> = {
  pending: Colors.warning,
  paid: Colors.success,
  shipped: Colors.info,
  failed: Colors.destructive,
  refunded: Colors.mutedForeground,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrderCard({ order, onPayNow, isPaying }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.productName} numberOfLines={2}>
          {order.productName}
        </Text>
        <Text style={styles.price}>{order.finalPrice.toFixed(2)} €</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.paymentStatus] + "20" }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[order.paymentStatus] }]}>
            {STATUS_LABEL[order.paymentStatus]}
          </Text>
        </View>
      </View>

      {order.paymentStatus === "pending" && (
        <View style={styles.footer}>
          <Text style={styles.deadline}>
            Avant le {formatDate(order.paymentDeadline)}
          </Text>
          <Pressable
            style={[styles.payButton, isPaying && styles.payButtonDisabled]}
            onPress={() => onPayNow(order.id)}
            disabled={isPaying}
          >
            <Text style={styles.payButtonText}>
              {isPaying ? "En cours…" : "Payer"}
            </Text>
          </Pressable>
        </View>
      )}

      {order.paymentStatus === "paid" && !order.shippedAt && (
        <Text style={styles.meta}>En attente d'expédition</Text>
      )}

      {order.shippedAt && (
        <Text style={styles.meta}>Expédié le {formatDate(order.shippedAt)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  price: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.foreground,
  },
  statusRow: {
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius["2xl"],
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deadline: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
  },
  payButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius["2xl"],
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
  },
  meta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
  },
});

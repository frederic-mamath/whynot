import { View, Text, Pressable, StyleSheet } from "react-native";

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
  pending: "#F59E0B",
  paid: "#10B981",
  shipped: "#3B82F6",
  failed: "#EF4444",
  refunded: "#6B7280",
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusRow: {
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deadline: {
    fontSize: 12,
    color: "#6B7280",
  },
  payButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    color: "#6B7280",
  },
});

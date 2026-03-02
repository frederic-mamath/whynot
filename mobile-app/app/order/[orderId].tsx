import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Package,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { usePayment } from "@/hooks/usePayment";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: any; label: string }
> = {
  pending: { color: "#f59e0b", icon: Clock, label: "Pending Payment" },
  paid: { color: "#22c55e", icon: CheckCircle, label: "Paid" },
  shipped: { color: "#3b82f6", icon: Truck, label: "Shipped" },
  failed: { color: "#ef4444", icon: XCircle, label: "Failed" },
  refunded: { color: "#8b5cf6", icon: XCircle, label: "Refunded" },
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { pay, loading: payLoading } = usePayment();

  // Get all orders and find the one we need
  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = trpc.order.getMyOrders.useQuery({});

  const order = orders?.find((o) => o.id === orderId);

  const handlePay = async () => {
    if (!orderId) return;
    const success = await pay(orderId);
    if (success) {
      Alert.alert("Success", "Payment completed!");
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  if (!order) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Order" }} />
        <Text style={styles.errorText}>Order not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const statusConf =
    STATUS_CONFIG[order.paymentStatus] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;
  const isPending = order.paymentStatus === "pending";

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Order #${orderId.slice(0, 8)}` }} />

      {/* Product section */}
      <View style={styles.section}>
        <View style={styles.productRow}>
          {order.productImageUrl ? (
            <Image
              source={{ uri: order.productImageUrl }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Package size={32} color={styles.placeholderIcon.color} />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.sellerText}>
              Seller: {order.sellerUsername}
            </Text>
          </View>
        </View>
      </View>

      {/* Status section */}
      <View style={styles.section}>
        <View style={styles.statusRow}>
          <StatusIcon size={24} color={statusConf.color} />
          <Text style={[styles.statusLabel, { color: statusConf.color }]}>
            {statusConf.label}
          </Text>
        </View>
      </View>

      {/* Price section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Final Price</Text>
          <Text style={styles.priceValue}>{order.finalPrice.toFixed(2)} €</Text>
        </View>

        <View style={styles.divider} />

        {order.paidAt && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Paid on</Text>
            <Text style={styles.priceValue}>
              {new Date(order.paidAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        {order.shippedAt && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipped on</Text>
            <Text style={styles.priceValue}>
              {new Date(order.shippedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        {isPending && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Payment deadline</Text>
            <Text style={styles.deadlineValue}>
              {new Date(order.paymentDeadline).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Pay button */}
      {isPending && (
        <View style={styles.paySection}>
          <Pressable
            style={({ pressed }) => [
              styles.payButton,
              pressed && styles.payButtonPressed,
              payLoading && styles.payButtonDisabled,
            ]}
            onPress={handlePay}
            disabled={payLoading}
          >
            {payLoading ? (
              <ActivityIndicator color={styles.payButtonText.color} />
            ) : (
              <>
                <CreditCard size={20} color={styles.payButtonText.color} />
                <Text style={styles.payButtonText}>
                  Pay {order.finalPrice.toFixed(2)} €
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Order created {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.foreground,
    fontWeight: "600",
  },
  linkText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  productRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "center",
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
  },
  productPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    color: theme.colors.mutedForeground,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  sellerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  priceLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  priceValue: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  deadlineValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.destructive,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  paySection: {
    padding: theme.spacing.lg,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  payButtonPressed: {
    opacity: 0.85,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "700",
    color: theme.colors.primaryForeground,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
}));

import { View, Text, FlatList, Pressable, Alert, Image } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useLocalSearchParams, Stack } from "expo-router";
import { Truck, Check, Package } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";

export default function DeliveriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();

  const {
    data: orders,
    isLoading,
    isError,
    refetch,
  } = trpc.order.getPendingDeliveries.useQuery();

  const shipMutation = trpc.order.markAsShipped.useMutation({
    onSuccess: () => {
      utils.order.getPendingDeliveries.invalidate();
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const handleShip = (orderId: string) => {
    Alert.alert("Mark as Shipped", "Confirm this order has been shipped?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => shipMutation.mutate({ orderId }),
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Deliveries" }} />

      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderId}>
                  Order #{String(item.id).slice(0, 8)}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.buyerName}>{item.buyerUsername}</Text>
            </View>

            <View style={styles.productRow}>
              {item.productImageUrl ? (
                <Image
                  source={{ uri: item.productImageUrl }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.productPlaceholder}>
                  <Package size={18} color={styles.placeholderIcon.color} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.productPrice}>
                  {item.finalPrice.toFixed(2)} €
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.shipButton,
                pressed && styles.shipButtonPressed,
                shipMutation.isPending && styles.shipButtonDisabled,
              ]}
              onPress={() => handleShip(String(item.id))}
              disabled={shipMutation.isPending}
            >
              <Check size={16} color={styles.shipButtonText.color} />
              <Text style={styles.shipButtonText}>Mark as Shipped</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Truck}
            title="No pending deliveries"
            message="All orders have been shipped"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderInfo: {
    gap: 2,
  },
  orderId: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  date: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  buyerName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
  },
  productPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    color: theme.colors.mutedForeground,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  productPrice: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  shipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
  },
  shipButtonPressed: {
    opacity: 0.85,
  },
  shipButtonDisabled: {
    opacity: 0.6,
  },
  shipButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
}));

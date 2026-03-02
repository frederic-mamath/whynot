import { View, FlatList, RefreshControl } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { OrderCard } from "@/components/OrderCard";

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } =
    trpc.order.getMyOrders.useQuery({});

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <FlatList
      style={styles.screen}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <OrderCard
          id={item.id}
          productName={item.productName}
          productImageUrl={item.productImageUrl}
          finalPrice={item.finalPrice}
          paymentStatus={item.paymentStatus}
          createdAt={item.createdAt}
          onPress={(orderId) => router.push(`/order/${orderId}`)}
        />
      )}
      contentContainerStyle={data?.length ? styles.list : styles.emptyContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          message="Your purchases will appear here"
        />
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  separator: {
    height: theme.spacing.sm,
  },
}));

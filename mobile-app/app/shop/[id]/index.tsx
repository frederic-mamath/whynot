import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Plus, Settings, Truck, Package } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopId = Number(id);
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: shop,
    isLoading: shopLoading,
    isError: shopError,
    refetch: refetchShop,
  } = trpc.shop.get.useQuery({ shopId });
  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
    refetch,
  } = trpc.product.list.useQuery({ shopId });

  const deleteMutation = trpc.shop.delete.useMutation({
    onSuccess: () => {
      utils.shop.list.invalidate();
      router.back();
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const handleDelete = () => {
    Alert.alert("Delete Shop", "This action cannot be undone. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ shopId }),
      },
    ]);
  };

  if (shopLoading || productsLoading) return <LoadingScreen />;
  if (shopError || productsError) {
    return (
      <ErrorScreen
        onRetry={() => {
          refetchShop();
          refetch();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: shop?.name ?? "Shop",
          headerRight: () => (
            <Pressable onPress={() => router.push(`/shop/${shopId}/edit`)}>
              <Settings size={22} color={styles.headerIcon.color} />
            </Pressable>
          ),
        }}
      />

      {/* Actions bar */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionPressed,
          ]}
          onPress={() => router.push(`/shop/${shopId}/products/create`)}
        >
          <Plus size={18} color={styles.actionIcon.color} />
          <Text style={styles.actionText}>Add Product</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionBtnSecondary,
            pressed && styles.actionPressed,
          ]}
          onPress={() => router.push(`/shop/${shopId}/deliveries`)}
        >
          <Truck size={18} color={styles.actionSecondaryIcon.color} />
          <Text style={styles.actionSecondaryText}>Deliveries</Text>
        </Pressable>
      </View>

      {/* Product list */}
      <FlatList
        data={products ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            id={item.id}
            name={item.name}
            price={item.price != null ? Number(item.price) : null}
            imageUrl={item.imageUrl}
            isActive={item.isActive}
            onPress={(pid) =>
              router.push(`/shop/${shopId}/products/${pid}/edit`)
            }
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={productsLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Package}
            title="No products"
            message="Add your first product to this shop"
          />
        }
        ListFooterComponent={
          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.actionPressed,
            ]}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>Delete Shop</Text>
          </Pressable>
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
  headerIcon: {
    color: theme.colors.foreground,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionIcon: {
    color: theme.colors.primaryForeground,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
  actionSecondaryIcon: {
    color: theme.colors.secondaryForeground,
  },
  actionSecondaryText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.secondaryForeground,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: theme.spacing.sm,
  },
  deleteBtn: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
  },
  deleteText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.destructive,
  },
}));

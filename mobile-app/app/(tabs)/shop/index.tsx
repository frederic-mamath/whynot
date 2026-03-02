import { View, Text, FlatList, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useRouter } from "expo-router";
import { Plus, Store } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { ShopCard } from "@/components/ShopCard";

export default function ShopListScreen() {
  const router = useRouter();
  const {
    data: shops,
    isLoading,
    isError,
    refetch,
  } = trpc.shop.list.useQuery();

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Shops</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push("/(tabs)/shop/create")}
        >
          <Plus size={20} color={styles.addIcon.color} />
          <Text style={styles.addText}>New Shop</Text>
        </Pressable>
      </View>

      <FlatList
        data={shops ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ShopCard
            id={item.id}
            name={item.name}
            description={item.description}
            role={item.userRole}
            onPress={(id) => router.push(`/shop/${id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Store}
            title="No shops yet"
            message="Create your first shop to start selling"
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addIcon: {
    color: theme.colors.primaryForeground,
  },
  addText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
  list: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: theme.spacing.sm,
  },
}));

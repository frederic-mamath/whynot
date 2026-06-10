import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { OrderCard } from "@/components/OrderCard";
import { usePopupCheckout } from "@/lib/stripe";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type FilterTab = "all" | "pending" | "paid" | "shipped";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "pending", label: "À payer" },
  { key: "paid", label: "Payé" },
  { key: "shipped", label: "Expédié" },
];

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { pay } = usePopupCheckout();

  const { data, isLoading, isFetching } = trpc.order.getMyOrders.useQuery({});

  const orders = data ?? [];

  const filtered = orders.filter((o) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return o.paymentStatus === "pending";
    if (activeTab === "paid") return o.paymentStatus === "paid";
    if (activeTab === "shipped") return o.paymentStatus === "shipped";
    return true;
  });

  const handlePayNow = async (orderId: string) => {
    setPayingOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    const amount = order?.finalPrice ?? 0;
    try {
      await pay(orderId, amount);
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Commandes</Text>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => utils.order.getMyOrders.invalidate()}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucune commande</Text>
              <Text style={styles.emptySub}>
                Rejoignez un live pour commencer à enchérir !
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPayNow={handlePayNow}
            isPaying={payingOrderId === item.id}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  pageTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.foreground,
    paddingHorizontal: Spacing.lg,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius["2xl"],
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.foreground,
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.primaryForeground,
    fontWeight: "600",
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing["2xl"],
    gap: 8,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    textAlign: "center",
  },
});

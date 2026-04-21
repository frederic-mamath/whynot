import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { trpc } from "@/lib/trpc";
import { OrderCard } from "@/components/OrderCard";

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

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const utils = trpc.useUtils();

  const { data, isLoading, isFetching } = trpc.order.getMyOrders.useQuery({});

  const createPaymentIntent = trpc.order.createPaymentIntent.useMutation();

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
    try {
      const { clientSecret } = await createPaymentIntent.mutateAsync({ orderId });

      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret ?? "",
        merchantDisplayName: "Popup",
      });

      if (initResult.error) {
        setPayingOrderId(null);
        return;
      }

      const result = await presentPaymentSheet();
      if (!result.error) {
        utils.order.getMyOrders.invalidate();
      }
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
    backgroundColor: "#F9FAFB",
    paddingTop: 60,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  tabText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

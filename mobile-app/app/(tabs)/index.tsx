import { View, Text, FlatList, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useRouter } from "expo-router";
import { Radio, ShoppingBag } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { ChannelCard } from "@/components/ChannelCard";
import { OrderCard } from "@/components/OrderCard";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const channels = trpc.channel.list.useQuery({});
  const orders = trpc.order.getMyOrders.useQuery({});

  const handleChannelPress = (channelId: number) => {
    router.push(`/channel/${channelId}`);
  };

  if (channels.isLoading || orders.isLoading) return <LoadingScreen />;
  if (channels.isError || orders.isError) {
    return (
      <ErrorScreen
        message="Impossible de charger le tableau de bord"
        onRetry={() => {
          channels.refetch();
          orders.refetch();
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        Hello{user?.email ? `, ${user.email.split("@")[0]}` : ""}
      </Text>

      {/* Live Channels Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Now</Text>
        {channels.data && channels.data.length > 0 ? (
          <View style={styles.channelGrid}>
            {channels.data.slice(0, 4).map((channel) => (
              <View key={channel.id} style={styles.channelCardWrapper}>
                <ChannelCard
                  id={channel.id}
                  name={channel.name}
                  participantCount={Number(channel.participantCount ?? 0)}
                  onPress={handleChannelPress}
                />
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Radio}
            title="No live channels"
            message="Check back later for live streams"
          />
        )}
      </View>

      {/* Recent Orders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {orders.data && orders.data.length > 0 ? (
          <View style={styles.orderList}>
            {orders.data.slice(0, 3).map((order) => (
              <OrderCard
                key={order.id}
                id={order.id}
                productName={order.productName}
                productImageUrl={order.productImageUrl}
                finalPrice={order.finalPrice}
                paymentStatus={order.paymentStatus}
                createdAt={order.createdAt}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            message="Your purchases will appear here"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["2xl"],
  },
  greeting: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  channelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  channelCardWrapper: {
    width: "48%",
  },
  orderList: {
    gap: theme.spacing.sm,
  },
}));

import { View, FlatList, RefreshControl, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useRouter } from "expo-router";
import { Radio, Video } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { EmptyState } from "@/components/EmptyState";
import { ChannelCard } from "@/components/ChannelCard";

export default function ChannelsScreen() {
  const router = useRouter();
  const { isSeller } = useUserRole();
  const { data, isLoading, isError, isRefetching, refetch } =
    trpc.channel.list.useQuery({});

  const handleChannelPress = (channelId: number) => {
    router.push(`/channel/${channelId}`);
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.screen}
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ChannelCard
            id={item.id}
            name={item.name}
            participantCount={Number(item.participantCount ?? 0)}
            onPress={handleChannelPress}
          />
        )}
        contentContainerStyle={
          data?.length ? styles.list : styles.emptyContainer
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon={Radio}
            title="No live channels"
            message="Pull to refresh or check back later"
          />
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />

      {isSeller && (
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push("/create-channel")}
        >
          <Video size={24} color={styles.fabIcon.color} />
        </Pressable>
      )}
    </View>
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
    height: theme.spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.destructive,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabIcon: {
    color: "#ffffff",
  },
}));

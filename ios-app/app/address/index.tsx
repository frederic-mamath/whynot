import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function AddressListScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading, isFetching, refetch } =
    trpc.profile.addresses.list.useQuery();

  const addresses = data ?? [];

  const onRefresh = () => {
    utils.profile.addresses.list.invalidate();
    refetch();
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucune adresse</Text>
            <Text style={styles.emptySub}>
              Ajoute une adresse de livraison pour recevoir tes commandes.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isRelay = item.mondialRelayPointId !== null;
          const onPress = isRelay
            ? undefined
            : () => router.push(`/address/${item.id}`);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && !isRelay && styles.cardPressed,
              ]}
              onPress={onPress}
              disabled={isRelay}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                <View style={styles.badges}>
                  {item.isDefault && (
                    <View style={[styles.badge, styles.badgeDefault]}>
                      <Text style={styles.badgeDefaultText}>Par défaut</Text>
                    </View>
                  )}
                  {isRelay && (
                    <View style={[styles.badge, styles.badgeRelay]}>
                      <Text style={styles.badgeRelayText}>Point relais</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.cardLine}>{item.street}</Text>
              {item.street2 ? (
                <Text style={styles.cardLine}>{item.street2}</Text>
              ) : null}
              <Text style={styles.cardLine}>
                {item.zipCode} {item.city}
              </Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push("/address/new")}>
        <Text style={styles.fabText}>+ Ajouter une adresse</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  cardPressed: { opacity: 0.6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardLine: { fontSize: 14, color: "#6B7280" },
  badges: { flexDirection: "row", gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeDefault: { backgroundColor: "#EDE9FE" },
  badgeDefaultText: { fontSize: 11, color: "#7C3AED", fontWeight: "700" },
  badgeRelay: { backgroundColor: "#FEF3C7" },
  badgeRelayText: { fontSize: 11, color: "#B45309", fontWeight: "700" },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

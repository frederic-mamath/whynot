import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function AddressListScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading, isFetching, refetch } =
    trpc.profile.addresses.list.useQuery();

  const addresses = data ?? [];

  const setDefaultMutation = trpc.profile.addresses.setDefault.useMutation({
    onSuccess: () => {
      utils.profile.addresses.list.invalidate();
      utils.profile.me.invalidate();
    },
    onError: (e) => Alert.alert("Erreur", e.message),
  });

  const deleteMutation = trpc.profile.addresses.delete.useMutation({
    onSuccess: () => {
      utils.profile.addresses.list.invalidate();
      utils.profile.me.invalidate();
    },
    onError: (e) => Alert.alert("Erreur", e.message),
  });

  const onRefresh = () => {
    utils.profile.addresses.list.invalidate();
    refetch();
  };

  const confirmDeleteRelay = (id: number, label: string) => {
    Alert.alert("Supprimer ce point relais ?", label, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ id }),
      },
    ]);
  };

  const handleRelayPress = (id: number, label: string, isDefault: boolean) => {
    const buttons: {
      text: string;
      style?: "cancel" | "destructive";
      onPress?: () => void;
    }[] = [];
    if (!isDefault) {
      buttons.push({
        text: "Définir par défaut",
        onPress: () => setDefaultMutation.mutate({ id }),
      });
    }
    buttons.push({
      text: "Supprimer",
      style: "destructive",
      onPress: () => confirmDeleteRelay(id, label),
    });
    buttons.push({ text: "Annuler", style: "cancel" });
    Alert.alert(label, "Que souhaitez-vous faire ?", buttons);
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
          const hasBadge = item.isDefault || isRelay;
          const onPress = isRelay
            ? () => handleRelayPress(item.id, item.label, item.isDefault)
            : () => router.push(`/address/${item.id}`);
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={onPress}
            >
              <Text style={styles.cardLabel}>{item.label}</Text>
              {hasBadge && (
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
              )}
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

      <View style={styles.bottomActions}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push("/address/new")}
        >
          <Text style={styles.fabText}>+ Ajouter une adresse</Text>
        </Pressable>
        <Pressable
          style={styles.relayButton}
          onPress={() => router.push("/address/relay")}
        >
          <Text style={styles.relayButtonText}>Choisir un point relais</Text>
        </Pressable>
      </View>
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
  list: { padding: 16, gap: 12, paddingBottom: 160 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  cardPressed: { opacity: 0.6 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardLine: { fontSize: 14, color: "#6B7280" },
  badges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
    marginBottom: 4,
  },
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
  bottomActions: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    gap: 8,
  },
  fab: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  relayButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  relayButtonText: { color: "#7C3AED", fontSize: 14, fontWeight: "600" },
});

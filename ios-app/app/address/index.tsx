/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-006 */
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
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function AddressListScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data, isLoading, isFetching, refetch } =
    trpc.profile.addresses.list.useQuery();

  const addresses = data ?? [];

  const setDefaultMutation = trpc.profile.addresses.setDefault.useMutation({
    onSuccess: (_, input) => {
      utils.profile.addresses.list.setData(undefined, (old) =>
        old
          ? old.map((a) => ({ ...a, isDefault: a.id === input.id }))
          : old,
      );
      utils.profile.addresses.list.invalidate();
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: old.addresses.map((a) => ({
                ...a,
                isDefault: a.id === input.id,
              })),
            }
          : old,
      );
      utils.profile.me.invalidate();
    },
    onError: (e) => Alert.alert("Erreur", e.message),
  });

  const deleteMutation = trpc.profile.addresses.delete.useMutation({
    onSuccess: (_, input) => {
      utils.profile.addresses.list.setData(undefined, (old) =>
        old ? old.filter((a) => a.id !== input.id) : old,
      );
      utils.profile.addresses.list.invalidate();
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: old.addresses.filter((a) => a.id !== input.id),
            }
          : old,
      );
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
        <ActivityIndicator color={Colors.primary} size="large" />
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
  container: { flex: 1, backgroundColor: Colors.card },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 160 },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  cardPressed: { opacity: 0.6 },
  cardLabel: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.foreground },
  cardLine: { fontSize: Typography.fontSize.sm, color: Colors.mutedForeground },
  badges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.md,
  },
  badgeDefault: { backgroundColor: Colors.accent },
  badgeDefaultText: { fontSize: 11, color: Colors.accentForeground, fontWeight: Typography.fontWeight.bold },
  badgeRelay: { backgroundColor: Colors.warning },
  badgeRelayText: { fontSize: 11, color: Colors.warningForeground, fontWeight: Typography.fontWeight.bold },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold, color: Colors.foreground },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    textAlign: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  bottomActions: {
    position: "absolute",
    bottom: 24,
    left: Spacing.lg,
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  fab: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: Colors.primaryForeground, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
  relayButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  relayButtonText: { color: Colors.primary, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
});

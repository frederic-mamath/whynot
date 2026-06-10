/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-010 (cache strategy sweep) */
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { optimisticUpdate } from "@/lib/optimisticUpdate";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function RelayPickerScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [postcode, setPostcode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchQuery = trpc.profile.addresses.searchRelayPoints.useQuery(
    { postcode, country: "FR" },
    { enabled: false, retry: false },
  );

  const saveMutation = trpc.profile.addresses.saveRelayPoint.useMutation(
    useMutationWithToast({
      onSuccess: (data, input) => {
        // Server-side: drops any existing relay point, unsets isDefault on
        // every other address, then inserts this one as default. Mirror that.
        optimisticUpdate(utils.profile.addresses.list, (old) => {
          const newRelay = {
            id: data.addressId,
            label: `Point Relais — ${input.name}`,
            street: input.street,
            street2: null,
            city: input.city,
            state: input.city,
            zipCode: input.zipCode,
            country: input.country ?? "FR",
            isDefault: true,
            mondialRelayPointId: input.relayPointId,
            createdAt: new Date().toISOString(),
          };
          const withoutOldRelays = (old ?? []).filter(
            (a) => a.mondialRelayPointId === null,
          );
          const cleared = withoutOldRelays.map((a) => ({ ...a, isDefault: false }));
          return [newRelay, ...cleared];
        });
        utils.profile.me.invalidate();
        router.back();
      },
    }),
  );

  const canSearch = /^\d{5}$/.test(postcode);
  const isLoading = searchQuery.isFetching;
  const hasError = hasSearched && !!searchQuery.error;
  const results = searchQuery.data ?? [];
  const showEmpty =
    hasSearched && !isLoading && !hasError && results.length === 0;

  const handleSearch = () => {
    if (!canSearch) return;
    setHasSearched(true);
    searchQuery.refetch();
  };

  const handleSelect = (point: (typeof results)[number]) => {
    Alert.alert(
      "Choisir ce point relais ?",
      `${point.name}\n${point.address}\n${point.zipCode} ${point.city}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: () =>
            saveMutation.mutate({
              relayPointId: point.id,
              name: point.name,
              street: point.address || point.name,
              city: point.city,
              zipCode: point.zipCode,
              country: "FR",
            }),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.label}>Code postal</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={postcode}
            onChangeText={setPostcode}
            placeholder="75001"
            keyboardType="number-pad"
            maxLength={5}
          />
          <Pressable
            style={[styles.searchButton, !canSearch && styles.searchDisabled]}
            onPress={handleSearch}
            disabled={!canSearch || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.searchButtonText}>Rechercher</Text>
            )}
          </Pressable>
        </View>
      </View>

      {hasError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTitle}>Service indisponible</Text>
          <Text style={styles.errorText}>
            Le service Mondial Relay est indisponible. Veuillez utiliser une
            adresse à domicile.
          </Text>
          <Pressable style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Retour</Text>
          </Pressable>
        </View>
      )}

      {showEmpty && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Aucun résultat</Text>
          <Text style={styles.emptySub}>
            Aucun point relais trouvé pour ce code postal.
          </Text>
        </View>
      )}

      {!hasError && (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                saveMutation.isPending && styles.disabled,
              ]}
              onPress={() => handleSelect(item)}
              disabled={saveMutation.isPending}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.distanceKm !== null && (
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      {item.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                )}
              </View>
              {item.address ? (
                <Text style={styles.cardLine}>{item.address}</Text>
              ) : null}
              <Text style={styles.cardLine}>
                {item.zipCode} {item.city}
              </Text>
            </Pressable>
          )}
        />
      )}

      {saveMutation.isPending && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.savingText}>Enregistrement…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  label: { fontSize: Typography.fontSize.xs, color: Colors.mutedForeground, fontWeight: "500" },
  searchRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.foreground,
    backgroundColor: Colors.input,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchDisabled: { backgroundColor: Colors.muted },
  searchButtonText: { color: Colors.primaryForeground, fontSize: Typography.fontSize.sm, fontWeight: "600" },
  list: { padding: Spacing.lg, gap: 12 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  cardPressed: { opacity: 0.6 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardName: { fontSize: Typography.fontSize.base, fontWeight: "700", color: Colors.foreground, flex: 1 },
  cardLine: { fontSize: Typography.fontSize.sm, color: Colors.mutedForeground },
  distanceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
  },
  distanceText: { fontSize: Typography.fontSize.xs, color: Colors.accentForeground, fontWeight: "700" },
  empty: {
    paddingTop: 60,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: Typography.fontSize.base, fontWeight: "700", color: Colors.foreground },
  emptySub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    textAlign: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  errorBanner: {
    margin: 16,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.destructive,
    gap: 8,
  },
  errorTitle: { fontSize: Typography.fontSize.sm, fontWeight: "700", color: Colors.destructive },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.foreground, lineHeight: 20 },
  errorButton: {
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: Colors.destructive,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  errorButtonText: { color: Colors.destructiveForeground, fontSize: Typography.fontSize.sm, fontWeight: "600" },
  savingOverlay: {
    // Translucent scrim over the screen while saving — standard iOS pattern,
    // works against any palette.
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  savingText: { color: Colors.foreground, fontSize: Typography.fontSize.sm, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});

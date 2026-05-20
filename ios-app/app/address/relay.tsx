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

export default function RelayPickerScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [postcode, setPostcode] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchQuery = trpc.profile.addresses.searchRelayPoints.useQuery(
    { postcode, country: "FR" },
    { enabled: false, retry: false },
  );

  const saveMutation = trpc.profile.addresses.saveRelayPoint.useMutation({
    onSuccess: () => {
      utils.profile.addresses.list.invalidate();
      utils.profile.me.invalidate();
      router.back();
    },
    onError: (e) => {
      Alert.alert("Échec de l'enregistrement", e.message);
    },
  });

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
              <ActivityIndicator color="#fff" />
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
          <ActivityIndicator color="#7C3AED" size="large" />
          <Text style={styles.savingText}>Enregistrement…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  searchBar: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  searchRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  searchDisabled: { backgroundColor: "#C4B5FD" },
  searchButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
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
  cardName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  cardLine: { fontSize: 14, color: "#6B7280" },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
  },
  distanceText: { fontSize: 12, color: "#7C3AED", fontWeight: "700" },
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
  errorBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    gap: 8,
  },
  errorTitle: { fontSize: 15, fontWeight: "700", color: "#991B1B" },
  errorText: { fontSize: 14, color: "#7F1D1D", lineHeight: 20 },
  errorButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  errorButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  savingText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});

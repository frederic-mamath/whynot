/* eslint-disable @typescript-eslint/no-floating-promises, max-lines -- TODO: floating-promises removed by ticket-006; max-lines tracked separately (file >400 lines, decompose) */
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ExternalLink,
  RefreshCw,
  Wallet,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useErrorBanner } from "@/hooks/useErrorBanner";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

type PackageStatus =
  | "pending"
  | "label_generated"
  | "shipped"
  | "delivered"
  | "incident";

const STATUS_LABELS: Record<PackageStatus, string> = {
  pending: "En attente",
  label_generated: "Étiquette créée",
  shipped: "Expédié",
  delivered: "Livré",
  incident: "Incident",
};

const chipStyles: Record<PackageStatus, { backgroundColor: string }> = {
  pending: { backgroundColor: Colors.muted },
  label_generated: { backgroundColor: Colors.accent },
  shipped: { backgroundColor: Colors.info },
  delivered: { backgroundColor: Colors.success },
  incident: { backgroundColor: Colors.destructive },
};

const chipTextStyles: Record<PackageStatus, { color: string }> = {
  pending: { color: Colors.mutedForeground },
  label_generated: { color: Colors.accentForeground },
  shipped: { color: Colors.infoForeground },
  delivered: { color: Colors.successForeground },
  incident: { color: Colors.destructiveForeground },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function SellerDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { showError } = useErrorBanner();

  const packagesQuery = trpc.package.getPackagesForSeller.useQuery();
  const pkg = (() => {
    const all = packagesQuery.data;
    if (!all) return null;
    return (
      all.pending.find((p) => p.id === id) ??
      all.shipped.find((p) => p.id === id) ??
      null
    );
  })();

  const [weight, setWeight] = useState("");
  const [manualTracking, setManualTracking] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [labelInfo, setLabelInfo] = useState<{
    trackingNumber: string;
    labelUrl: string;
  } | null>(null);

  const generateMutation = trpc.package.generateLabel.useMutation(
    useMutationWithToast({
      onSuccess: (data) => {
        setLabelInfo({
          trackingNumber: data.trackingNumber,
          labelUrl: data.labelUrl,
        });
        utils.package.getPackagesForSeller.invalidate();
      },
    }),
  );
  const refreshMutation = trpc.package.refreshStatus.useMutation(
    useMutationWithToast({
      onSuccess: () => {
        utils.package.getPackagesForSeller.invalidate();
      },
    }),
  );
  const payoutMutation = trpc.package.requestPayouts.useMutation(useMutationWithToast());
  const markShippedMutation = trpc.package.markShippedManually.useMutation(
    useMutationWithToast({
      onSuccess: async () => {
        await utils.package.getPackagesForSeller.invalidate();
        router.back();
      },
    }),
  );

  if (packagesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!pkg) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={24} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.title}>Colis introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = pkg.status as PackageStatus;
  const showMondialRelayForm =
    pkg.hasBuyerRelayPoint &&
    (status === "pending" || status === "label_generated") &&
    !pkg.trackingNumber;
  const showTrackingInfo = !!pkg.trackingNumber || !!labelInfo;
  const canRefresh = !!pkg.trackingNumber && status !== "delivered";
  const canRequestPayout = status === "shipped" || status === "delivered";

  const trackingNumber = pkg.trackingNumber ?? labelInfo?.trackingNumber ?? null;
  const labelUrl = pkg.labelUrl ?? labelInfo?.labelUrl ?? null;

  const handleGenerate = async () => {
    const grams = parseInt(weight.trim(), 10);
    if (!Number.isFinite(grams) || grams < 1 || grams > 30000) {
      showError("Poids invalide. Entrez un poids en grammes (entre 1 et 30 000).");
      return;
    }
    await generateMutation
      .mutateAsync({ packageId: pkg.id, weightGrams: grams })
      .catch(() => null);
  };

  const handleRefresh = async () => {
    await refreshMutation.mutateAsync({ packageId: pkg.id }).catch(() => null);
  };

  const handleMarkShipped = async () => {
    setManualError(null);
    const trimmed = manualTracking.trim();
    if (!trimmed) {
      setManualError("Le numéro de suivi est obligatoire");
      return;
    }
    try {
      await markShippedMutation.mutateAsync({
        packageId: pkg!.id,
        trackingNumber: trimmed,
      });
    } catch (e) {
      setManualError(
        e instanceof Error ? e.message : "Impossible d'enregistrer le suivi",
      );
    }
  };

  const handlePayout = async () => {
    try {
      await payoutMutation.mutateAsync({ packageId: pkg.id });
      Alert.alert(
        "Demande envoyée",
        "Votre demande de paiement a bien été enregistrée.",
      );
    } catch {
      // useMutationWithToast already surfaced the error via the banner.
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Colis {pkg.id.slice(0, 8)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Statut</Text>
            <View style={[styles.chip, chipStyles[status]]}>
              <Text style={[styles.chipText, chipTextStyles[status]]}>
                {STATUS_LABELS[status]}
              </Text>
            </View>
          </View>
          <View style={styles.metaLine}>
            <Text style={styles.metaKey}>Acheteur</Text>
            <Text style={styles.metaValue}>{pkg.buyerName}</Text>
          </View>
          <View style={styles.metaLine}>
            <Text style={styles.metaKey}>Live</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {pkg.liveName}
            </Text>
          </View>
          <View style={styles.metaLine}>
            <Text style={styles.metaKey}>Créé le</Text>
            <Text style={styles.metaValue}>{formatDate(pkg.createdAt)}</Text>
          </View>
        </View>

        <Section title="Articles">
          {pkg.orders.map((order) => (
            <View key={order.id} style={styles.orderRow}>
              {order.productImageUrl ? (
                <Image
                  source={{ uri: order.productImageUrl }}
                  style={styles.orderThumb}
                />
              ) : (
                <View style={[styles.orderThumb, styles.thumbFallback]} />
              )}
              <View style={styles.orderInfo}>
                <Text style={styles.orderName} numberOfLines={1}>
                  {order.productName}
                </Text>
                <Text style={styles.orderPrice}>
                  {order.finalPrice.toFixed(2)} €
                </Text>
              </View>
            </View>
          ))}
        </Section>

        {showTrackingInfo && trackingNumber && (
          <Section title="Suivi">
            <View style={styles.trackingCard}>
              <View style={styles.metaLine}>
                <Text style={styles.metaKey}>Numéro</Text>
                <Text style={styles.metaValue}>{trackingNumber}</Text>
              </View>
              {labelUrl && (
                <Pressable
                  style={({ pressed }) => [
                    styles.linkBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => Linking.openURL(labelUrl)}
                >
                  <ExternalLink size={16} color={Colors.primary} />
                  <Text style={styles.linkText}>Voir l'étiquette</Text>
                </Pressable>
              )}
              {canRefresh && (
                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.pressed,
                    refreshMutation.isPending && styles.btnDisabled,
                  ]}
                  disabled={refreshMutation.isPending}
                  onPress={handleRefresh}
                >
                  {refreshMutation.isPending ? (
                    <ActivityIndicator color={Colors.foreground} />
                  ) : (
                    <>
                      <RefreshCw size={16} color={Colors.foreground} />
                      <Text style={styles.secondaryBtnText}>
                        Actualiser le statut
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </Section>
        )}

        {showMondialRelayForm && (
          <Section title="Mondial Relay">
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Poids (en grammes)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="Ex: 500"
                placeholderTextColor={Colors.inputHint}
                keyboardType="number-pad"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  generateMutation.isPending && styles.btnDisabled,
                ]}
                disabled={generateMutation.isPending}
                onPress={handleGenerate}
              >
                {generateMutation.isPending ? (
                  <ActivityIndicator color={Colors.primaryForeground} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    Générer l'étiquette
                  </Text>
                )}
              </Pressable>
            </View>
          </Section>
        )}

        {!pkg.hasBuyerRelayPoint && !pkg.trackingNumber && status === "pending" && (
          <Section title="Expédition">
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Numéro de suivi</Text>
              <TextInput
                style={styles.input}
                value={manualTracking}
                onChangeText={(v) => {
                  setManualTracking(v);
                  if (manualError) setManualError(null);
                }}
                placeholder="Ex: 1Z999AA10123456784"
                placeholderTextColor={Colors.inputHint}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {manualError && (
                <Text style={styles.errorText}>{manualError}</Text>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  markShippedMutation.isPending && styles.btnDisabled,
                ]}
                disabled={markShippedMutation.isPending}
                onPress={handleMarkShipped}
              >
                {markShippedMutation.isPending ? (
                  <ActivityIndicator color={Colors.primaryForeground} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    Marquer comme expédié
                  </Text>
                )}
              </Pressable>
            </View>
          </Section>
        )}

        {canRequestPayout && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
              payoutMutation.isPending && styles.btnDisabled,
            ]}
            disabled={payoutMutation.isPending}
            onPress={handlePayout}
          >
            {payoutMutation.isPending ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <>
                <Wallet size={18} color={Colors.primaryForeground} />
                <Text style={styles.primaryBtnText}>Demander le paiement</Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBtn: { padding: Spacing.xs },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    fontWeight: "600",
  },
  metaLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },
  metaKey: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  metaValue: {
    flex: 1,
    textAlign: "right",
    fontSize: Typography.fontSize.sm,
    color: Colors.foreground,
    fontWeight: "500",
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  thumbFallback: { backgroundColor: Colors.muted },
  orderInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  orderName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "500",
    color: Colors.foreground,
  },
  orderPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  trackingCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: Typography.fontSize.sm,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  input: {
    backgroundColor: Colors.input,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.sm,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
  },
  primaryBtnText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.input,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  btnDisabled: { opacity: 0.6 },
  pressed: { opacity: 0.7 },
});

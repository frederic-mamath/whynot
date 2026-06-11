import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

const DURATION_PRESETS: ReadonlyArray<{
  label: string;
  value: 60 | 300 | 600 | 1800;
}> = [
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "30 min", value: 1800 },
];

type HighlightedProduct = {
  id: number;
  name: string;
  price?: number | null;
  imageUrl?: string | null;
};

type Props = {
  channelId: number;
  visible: boolean;
  onClose: () => void;
  product: HighlightedProduct | undefined;
};

export function AuctionSheet({ channelId, visible, onClose, product }: Props) {
  const [duration, setDuration] = useState<60 | 300 | 600 | 1800>(60);
  const [buyout, setBuyout] = useState("");

  const utils = trpc.useUtils();
  const startAuctionMutation = trpc.auction.start.useMutation(
    useMutationWithToast(),
  );

  useEffect(() => {
    if (visible) {
      setDuration(60);
      setBuyout("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!product) return;
    const buyoutPrice = buyout.trim()
      ? parseFloat(buyout.replace(",", "."))
      : undefined;
    try {
      await startAuctionMutation.mutateAsync({
        productId: product.id,
        durationSeconds: duration,
        buyoutPrice,
      });
      void utils.auction.getActive.invalidate({ channelId });
      onClose();
    } catch {
      // useMutationWithToast already surfaced the error via banner.
    }
  };

  const isSubmitting = startAuctionMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <X size={24} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.title}>Lancer une enchère</Text>
          <View style={styles.iconBtn} />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.content}>
            {product && (
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]} />
                  )}
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryName}>{product.name}</Text>
                    {product.price != null && (
                      <Text style={styles.summaryPrice}>
                        Prix de départ : {product.price.toFixed(2)} €
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>Durée</Text>
            <View style={styles.chipsRow}>
              {DURATION_PRESETS.map((p) => (
                <Pressable
                  key={p.value}
                  style={({ pressed }) => [
                    styles.chip,
                    duration === p.value && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setDuration(p.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      duration === p.value && styles.chipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>
              Prix d&apos;achat immédiat (optionnel)
            </Text>
            <TextInput
              style={styles.input}
              value={buyout}
              onChangeText={setBuyout}
              placeholder="Ex: 50.00"
              placeholderTextColor={Colors.inputHint}
              keyboardType="decimal-pad"
            />

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.pressed,
                isSubmitting && styles.submitDisabled,
              ]}
              disabled={isSubmitting}
              onPress={handleSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <Text style={styles.submitText}>Lancer l&apos;enchère</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBtn: { width: 32, alignItems: "center" },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.foreground,
  },
  content: { padding: Spacing.lg, gap: Spacing.md },
  summary: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  summaryInfo: { flex: 1, gap: Spacing.xs },
  summaryName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  summaryPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  thumb: { width: 48, height: 48, borderRadius: Radius.sm },
  thumbFallback: { backgroundColor: Colors.muted },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
    marginTop: Spacing.sm,
  },
  chipsRow: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  chipTextActive: { color: Colors.primaryForeground },
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
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
  },
  pressed: { opacity: 0.7 },
});

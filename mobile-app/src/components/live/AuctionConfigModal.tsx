import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { X, Gavel } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

const DURATION_OPTIONS = [
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "30 min", value: 1800 },
] as const;

type AuctionDuration = 60 | 300 | 600 | 1800;

interface AuctionConfigModalProps {
  visible: boolean;
  onClose: () => void;
  highlightedProductId: number | null;
  highlightedProductName: string | null;
}

export function AuctionConfigModal({
  visible,
  onClose,
  highlightedProductId,
  highlightedProductName,
}: AuctionConfigModalProps) {
  const [duration, setDuration] = useState<AuctionDuration>(300);
  const [buyoutPrice, setBuyoutPrice] = useState("");

  const startMutation = trpc.auction.start.useMutation({
    onSuccess: () => {
      onClose();
      setBuyoutPrice("");
      setDuration(300);
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const handleStart = () => {
    if (!highlightedProductId) {
      Alert.alert(
        "No Product",
        "Highlight a product first to start an auction.",
      );
      return;
    }

    const buyout = buyoutPrice.trim() ? parseFloat(buyoutPrice) : undefined;
    if (buyoutPrice.trim() && (isNaN(buyout!) || buyout! <= 0)) {
      Alert.alert("Validation", "Please enter a valid buyout price.");
      return;
    }

    startMutation.mutate({
      productId: highlightedProductId,
      durationSeconds: duration,
      buyoutPrice: buyout,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Gavel size={20} color={styles.headerIcon.color} />
              <Text style={styles.title}>Start Auction</Text>
            </View>
            <Pressable onPress={onClose}>
              <X size={24} color={styles.closeIcon.color} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {highlightedProductName ? (
              <View style={styles.productBanner}>
                <Text style={styles.productLabel}>Product</Text>
                <Text style={styles.productName}>{highlightedProductName}</Text>
              </View>
            ) : (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  Highlight a product first to start an auction
                </Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Duration</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.durationBtn,
                      duration === opt.value && styles.durationBtnActive,
                    ]}
                    onPress={() => setDuration(opt.value)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        duration === opt.value && styles.durationTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Buyout Price (optional)</Text>
              <TextInput
                style={styles.input}
                value={buyoutPrice}
                onChangeText={setBuyoutPrice}
                placeholder="e.g. 50.00"
                placeholderTextColor={styles.placeholderColor.color}
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>
                Allow instant buy at this price. Leave empty for no buyout.
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
                (!highlightedProductId || startMutation.isPending) &&
                  styles.startButtonDisabled,
              ]}
              onPress={handleStart}
              disabled={!highlightedProductId || startMutation.isPending}
            >
              {startMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.startButtonText}>Start Auction</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  headerIcon: {
    color: theme.colors.foreground,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  closeIcon: {
    color: theme.colors.mutedForeground,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  productBanner: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  productLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    fontWeight: "500",
  },
  productName: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  warningBanner: {
    backgroundColor: "rgba(229, 72, 77, 0.12)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.destructive,
    fontWeight: "500",
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  durationRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  durationBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  durationText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  durationTextActive: {
    color: theme.colors.primaryForeground,
    fontWeight: "700",
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  placeholderColor: {
    color: theme.colors.mutedForeground,
  },
  startButton: {
    backgroundColor: theme.colors.destructive,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "700",
    color: "#fff",
  },
}));

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Radio, Square, Tag } from "lucide-react-native";
import { Colors, Radius, Spacing } from "@/theme/tokens";

type Props = {
  isBroadcasting: boolean;
  hasInitialized: boolean;
  hasHighlightedProduct: boolean;
  hasActiveAuction: boolean;
  onStartLive: () => void;
  onOpenHighlight: () => void;
  onOpenAuction: () => void;
  onEndLive: () => void;
};

export function BroadcasterBottomBar({
  isBroadcasting,
  hasInitialized,
  hasHighlightedProduct,
  hasActiveAuction,
  onStartLive,
  onOpenHighlight,
  onOpenAuction,
  onEndLive,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      {!isBroadcasting ? (
        <View style={styles.startWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              pressed && styles.pressed,
              !hasInitialized && styles.startBtnDisabled,
            ]}
            onPress={onStartLive}
            disabled={!hasInitialized}
          >
            {!hasInitialized ? (
              <ActivityIndicator color={Colors.destructiveForeground} />
            ) : (
              <>
                <Radio size={20} color={Colors.destructiveForeground} />
                <Text style={styles.startBtnText}>Démarrer le live</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.controlsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.controlBtn,
              pressed && styles.pressed,
            ]}
            onPress={onOpenHighlight}
          >
            <Tag size={20} color={Colors.foreground} />
            <Text style={styles.controlBtnText}>Produit</Text>
          </Pressable>
          {hasHighlightedProduct && !hasActiveAuction && (
            <Pressable
              style={({ pressed }) => [
                styles.auctionBtn,
                pressed && styles.pressed,
              ]}
              onPress={onOpenAuction}
            >
              <Plus size={20} color={Colors.primaryForeground} />
              <Text style={styles.controlBtnText}>Enchère</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.terminateBtn,
              pressed && styles.pressed,
            ]}
            onPress={onEndLive}
          >
            <Square size={20} color={Colors.destructive} />
            <Text style={[styles.controlBtnText, styles.terminateBtnText]}>
              Terminer
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  startWrap: {
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.destructive,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 999,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: {
    color: Colors.destructiveForeground,
    fontSize: 16,
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  auctionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  controlBtnText: {
    color: Colors.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
  terminateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.destructive,
  },
  terminateBtnText: {
    color: Colors.destructive,
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Props = {
  isBroadcasting: boolean;
  onClose: () => void;
};

export function BroadcasterTopBar({ isBroadcasting, onClose }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={onClose} style={styles.iconBtn}>
          <X size={22} color={Colors.foreground} />
        </Pressable>
        {isBroadcasting && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
        <View style={styles.iconBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius["2xl"],
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.destructive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.destructiveForeground,
  },
  liveBadgeText: {
    color: Colors.destructiveForeground,
    fontWeight: "700",
    fontSize: Typography.fontSize.xs,
    letterSpacing: 0.5,
  },
});

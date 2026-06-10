import { View, Text, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Props = {
  channelId: number;
};

export function LiveBadge({ channelId }: Props) {
  const { data: participants } = trpc.live.participants.useQuery(
    { channelId },
    { refetchInterval: 10_000 }
  );

  const count = participants?.length ?? 0;

  return (
    <View style={styles.row}>
      <View style={styles.livePill}>
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <View style={styles.countPill}>
        <Text style={styles.countText}>👁 {count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  livePill: {
    backgroundColor: Colors.destructive,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  liveText: {
    color: Colors.destructiveForeground,
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  countPill: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  countText: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.xs,
    fontWeight: "500",
  },
});

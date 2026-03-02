import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Radio, Users } from "lucide-react-native";

interface LiveBadgeProps {
  viewerCount: number;
}

export function LiveBadge({ viewerCount }: LiveBadgeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.livePill}>
        <Radio size={12} color="#fff" strokeWidth={2.5} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <View style={styles.viewerPill}>
        <Users size={12} color="#fff" strokeWidth={2} />
        <Text style={styles.viewerText}>{viewerCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    flexDirection: "row",
    gap: 8,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(229, 72, 77, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  liveText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  viewerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  viewerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
}));

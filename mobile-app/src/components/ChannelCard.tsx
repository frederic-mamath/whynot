import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Radio, Users } from "lucide-react-native";

interface ChannelCardProps {
  id: number;
  name: string;
  participantCount: number;
  onPress: (id: number) => void;
}

export function ChannelCard({
  id,
  name,
  participantCount,
  onPress,
}: ChannelCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(id)}
    >
      <View style={styles.liveBadge}>
        <Radio size={14} color={styles.liveIcon.color} strokeWidth={2.5} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>

      <View style={styles.meta}>
        <Users size={14} color={styles.metaText.color} />
        <Text style={styles.metaText}>{participantCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "rgba(229, 72, 77, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  liveIcon: {
    color: theme.colors.destructive,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.destructive,
    letterSpacing: 0.5,
  },
  name: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
}));

import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { LucideIcon } from "lucide-react-native";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
}

export function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={48} color={styles.icon.color} strokeWidth={1.5} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  icon: {
    color: theme.colors.mutedForeground,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.foreground,
    textAlign: "center",
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: "center",
  },
}));

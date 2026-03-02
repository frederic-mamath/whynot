import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { AlertCircle, RotateCcw } from "lucide-react-native";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Full-screen error state — shown when a query fails (network, server, etc.).
 * Provides a retry button for refetching.
 */
export function ErrorScreen({
  message = "Impossible de charger les données",
  onRetry,
}: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <AlertCircle size={40} color="#e5484d" />
      <Text style={styles.title}>Erreur</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry}>
          <RotateCcw size={16} color="#faf8f6" />
          <Text style={styles.buttonText}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
  },
  message: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
}));

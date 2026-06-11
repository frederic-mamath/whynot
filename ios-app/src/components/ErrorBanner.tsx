import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useErrorBanner } from "@/hooks/useErrorBanner";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export function ErrorBanner() {
  const { current, clearError } = useErrorBanner();
  const insets = useSafeAreaInsets();

  if (current === null) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingTop: insets.top + Spacing.xs }]}
    >
      <Pressable
        accessibilityRole="alert"
        accessibilityLabel={current.message}
        onPress={clearError}
        style={styles.banner}
      >
        <Text style={styles.text} numberOfLines={3}>
          {current.message}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 1000,
    elevation: 1000,
  },
  banner: {
    backgroundColor: Colors.destructive,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  text: {
    color: Colors.destructiveForeground,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});

import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Popup</Text>
        <Text style={styles.tagline}>Le live commerce français</Text>
      </View>

      <View style={styles.actions}>
        <SocialAuthButtons />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.primaryButtonText}>Créer un compte</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.secondaryButtonText}>Se connecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: 120,
    paddingBottom: 60,
  },
  hero: {
    alignItems: "center",
    gap: Spacing.md,
  },
  logo: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    color: Colors.mutedForeground,
    textAlign: "center",
  },
  actions: {
    gap: Spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.inputHint },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  primaryButtonText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});

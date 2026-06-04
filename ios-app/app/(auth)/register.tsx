import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useTrack } from "@/lib/analytics";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { Colors } from "@/theme/tokens";

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const track = useTrack();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedCgu, setAcceptedCgu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await login(data.token, data.user);
      track({ name: "sign_up_completed", method: "email" });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = () => {
    setError(null);
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (!acceptedCgu) {
      setError("Vous devez accepter les CGU pour continuer");
      return;
    }
    registerMutation.mutate({
      email: email.trim(),
      password,
      acceptedCgu: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Créer un compte</Text>

        <SocialAuthButtons />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.inputHint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (8 caractères min.)"
            placeholderTextColor={Colors.inputHint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={styles.cguRow}
            onPress={() => setAcceptedCgu(!acceptedCgu)}
          >
            <View style={[styles.checkbox, acceptedCgu && styles.checkboxChecked]}>
              {acceptedCgu && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.cguText}>
              J'accepte les{" "}
              <Text style={styles.cguLink}>conditions générales d'utilisation</Text>
            </Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[
              styles.button,
              registerMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Créer mon compte</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.switchText}>
            Déjà un compte ?{" "}
            <Text style={styles.switchLink}>Se connecter</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  back: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  backText: {
    color: Colors.primary,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.foreground,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.mutedForeground },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.foreground,
    backgroundColor: Colors.input,
  },
  cguRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.input,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.primaryForeground,
    fontSize: 13,
    fontWeight: "700",
  },
  cguText: {
    flex: 1,
    fontSize: 14,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  cguLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  error: {
    color: Colors.destructive,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  switchText: {
    textAlign: "center",
    color: Colors.mutedForeground,
    fontSize: 15,
  },
  switchLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
});

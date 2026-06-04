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
} from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useTrack } from "@/lib/analytics";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { Colors } from "@/theme/tokens";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const track = useTrack();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await login(data.token, data.user);
      track({ name: "login_completed", method: "email" });
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
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Connexion</Text>

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
            placeholder="Mot de passe"
            placeholderTextColor={Colors.inputHint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[
              styles.button,
              loginMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace("/(auth)/register")}>
          <Text style={styles.switchText}>
            Pas encore de compte ?{" "}
            <Text style={styles.switchLink}>Créer un compte</Text>
          </Text>
        </Pressable>
      </View>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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

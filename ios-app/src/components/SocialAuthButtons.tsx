import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useTrack } from "@/lib/analytics";
import { notify } from "@/lib/alerts";
import {
  signInWithApple,
  signInWithGoogle,
  SocialAuthCanceledError,
} from "@/lib/socialAuth";
import { Radius, Typography } from "@/theme/tokens";

type Loading = "apple" | "google" | null;

export function SocialAuthButtons() {
  const { login } = useAuth();
  const track = useTrack();
  const [loading, setLoading] = useState<Loading>(null);

  const appleMutation = trpc.auth.appleSignIn.useMutation();
  const googleMutation = trpc.auth.googleSignIn.useMutation();

  const handleApple = async () => {
    setLoading("apple");
    try {
      const result = await signInWithApple();
      const data = await appleMutation.mutateAsync({
        idToken: result.identityToken,
        firstName: result.firstName ?? undefined,
        lastName: result.lastName ?? undefined,
      });
      await login(data.token, data.user);
      track({
        name: data.isNewUser ? "sign_up_completed" : "login_completed",
        method: "apple",
      });
    } catch (err) {
      if (!(err instanceof SocialAuthCanceledError)) {
        notify({
          title: "Connexion impossible",
          message: "La connexion avec Apple a échoué. Réessaie plus tard.",
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading("google");
    try {
      const result = await signInWithGoogle();
      const data = await googleMutation.mutateAsync({ idToken: result.idToken });
      await login(data.token, data.user);
      track({
        name: data.isNewUser ? "sign_up_completed" : "login_completed",
        method: "google",
      });
    } catch (err) {
      if (!(err instanceof SocialAuthCanceledError)) {
        notify({
          title: "Connexion impossible",
          message: "La connexion avec Google a échoué. Réessaie plus tard.",
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const isDisabled = loading !== null;

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" && (
        <Pressable
          style={[styles.button, styles.appleButton, isDisabled && styles.disabled]}
          onPress={handleApple}
          disabled={isDisabled}
        >
          {loading === "apple" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.appleLogo}></Text>
              <Text style={styles.appleText}>Continuer avec Apple</Text>
            </>
          )}
        </Pressable>
      )}
      <Pressable
        style={[styles.button, styles.googleButton, isDisabled && styles.disabled]}
        onPress={handleGoogle}
        disabled={isDisabled}
      >
        {loading === "google" ? (
          <ActivityIndicator color="#111827" />
        ) : (
          <>
            <Text style={styles.googleLogo}>G</Text>
            <Text style={styles.googleText}>Continuer avec Google</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: Radius.xl,
  },
  appleButton: { backgroundColor: "#000" },
  appleLogo: {
    color: "#fff",
    fontSize: Typography.fontSize.xl,
    marginTop: -2,
  },
  appleText: { color: "#fff", fontSize: Typography.fontSize.base, fontWeight: "600" },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#DADCE0",
  },
  googleLogo: {
    color: "#4285F4",
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
  },
  googleText: { color: "#111827", fontSize: Typography.fontSize.base, fontWeight: "600" },
  disabled: { opacity: 0.6 },
});

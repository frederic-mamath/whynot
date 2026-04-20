import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";

export default function OnboardingScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [nickname, setNickname] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = trpc.image.upload.useMutation();

  const onboardingMutation = trpc.profile.completeOnboarding.useMutation({
    onSuccess: async () => {
      await utils.profile.me.invalidate();
      router.replace("/(tabs)");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmed = nickname.trim();

    if (!trimmed || trimmed.length < 1) {
      setError("Le pseudo est obligatoire");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setError("Le pseudo ne peut contenir que des lettres, chiffres, _ . -");
      return;
    }

    let avatarUrl: string | undefined;
    if (avatarBase64) {
      try {
        const uploaded = await uploadMutation.mutateAsync({ base64: avatarBase64 });
        avatarUrl = uploaded.url;
      } catch {
        // Avatar upload failure is non-blocking — proceed without it
      }
    }

    onboardingMutation.mutate({ nickname: trimmed, avatarUrl });
  };

  const isPending = uploadMutation.isPending || onboardingMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bienvenue sur Popup !</Text>
          <Text style={styles.subtitle}>Choisissez votre pseudo pour commencer</Text>
        </View>

        <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>📷</Text>
              <Text style={styles.avatarPlaceholderLabel}>Photo (optionnel)</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Pseudo (ex: marie_dupont)"
            placeholderTextColor="#9CA3AF"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={50}
          />
          <Text style={styles.hint}>
            Lettres, chiffres, _ . - uniquement
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continuer</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    gap: 32,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  avatar: {
    width: 100,
    height: 100,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarPlaceholderText: {
    fontSize: 24,
  },
  avatarPlaceholderLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  hint: {
    fontSize: 13,
    color: "#9CA3AF",
    paddingHorizontal: 4,
  },
  error: {
    color: "#EF4444",
    fontSize: 14,
    paddingHorizontal: 4,
  },
  button: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

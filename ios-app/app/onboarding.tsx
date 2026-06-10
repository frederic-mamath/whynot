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
import { optimisticUpdate } from "@/lib/optimisticUpdate";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function OnboardingScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [nickname, setNickname] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = trpc.image.upload.useMutation();

  const onboardingMutation = trpc.profile.completeOnboarding.useMutation({
    onSuccess: (_, input) => {
      optimisticUpdate(utils.profile.me, (old) =>
        old
          ? {
              ...old,
              nickname: input.nickname,
              avatarUrl: input.avatarUrl ?? null,
              hasCompletedOnboarding: true,
            }
          : old,
      );
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
            placeholderTextColor={Colors.inputHint}
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
              <ActivityIndicator color={Colors.primaryForeground} />
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
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.xl,
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
    fontSize: Typography.fontSize["3xl"],
    fontWeight: "700",
    color: Colors.foreground,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.mutedForeground,
    textAlign: "center",
  },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  avatar: {
    width: 100,
    height: 100,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: Radius.pill,
    backgroundColor: Colors.muted,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  avatarPlaceholderText: {
    fontSize: Typography.fontSize["2xl"],
  },
  avatarPlaceholderLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.inputHint,
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    backgroundColor: Colors.input,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.inputHint,
    paddingHorizontal: Spacing.xs,
  },
  error: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.sm,
    paddingHorizontal: Spacing.xs,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
});

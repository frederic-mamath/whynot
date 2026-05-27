import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, y, mo, d] = dateMatch;
  const [, h, mi] = timeMatch;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
    0,
  );
  if (isNaN(date.getTime())) return null;
  return date;
}

export default function SellerLiveNewScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [description, setDescription] = useState("");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scheduleMutation = trpc.live.schedule.useMutation();
  const uploadMutation = trpc.image.upload.useMutation();

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
      setCoverBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError("Le nom doit contenir au moins 3 caractères");
      return;
    }

    const startsAt = parseDateTime(dateStr.trim(), timeStr.trim());
    if (!startsAt) {
      setError("Format de date attendu : AAAA-MM-JJ — Format d'heure : HH:MM");
      return;
    }
    if (startsAt.getTime() <= Date.now()) {
      setError("La date doit être dans le futur");
      return;
    }

    try {
      let coverUrl: string | undefined;
      if (coverBase64) {
        const uploaded = await uploadMutation.mutateAsync({
          base64: coverBase64,
        });
        coverUrl = uploaded.url;
      }

      await scheduleMutation.mutateAsync({
        name: trimmedName,
        startsAt: startsAt.toISOString(),
        description: description.trim() || undefined,
        coverUrl,
      });

      await utils.live.listByHost.invalidate();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la planification");
    }
  };

  const isSubmitting =
    scheduleMutation.isPending || uploadMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Planifier un live</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={pickCover} style={styles.cover}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <ImagePlus size={32} color={Colors.mutedForeground} />
                <Text style={styles.coverHint}>Ajouter une image de couverture</Text>
              </View>
            )}
          </Pressable>

          <Field label="Nom du live *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Drop printemps"
              placeholderTextColor={Colors.inputHint}
            />
          </Field>

          <View style={styles.row}>
            <View style={styles.col}>
              <Field label="Date * (AAAA-MM-JJ)">
                <TextInput
                  style={styles.input}
                  value={dateStr}
                  onChangeText={setDateStr}
                  placeholder="2026-06-15"
                  placeholderTextColor={Colors.inputHint}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Field>
            </View>
            <View style={styles.col}>
              <Field label="Heure * (HH:MM)">
                <TextInput
                  style={styles.input}
                  value={timeStr}
                  onChangeText={setTimeStr}
                  placeholder="20:30"
                  placeholderTextColor={Colors.inputHint}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Field>
            </View>
          </View>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Présentez votre live aux acheteurs"
              placeholderTextColor={Colors.inputHint}
              multiline
              numberOfLines={4}
            />
          </Field>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
              isSubmitting && styles.submitDisabled,
            ]}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>Planifier</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  back: { padding: Spacing.xs },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.muted,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  coverHint: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  field: { gap: Spacing.xs },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  input: {
    backgroundColor: Colors.input,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  error: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.sm,
  },
  submit: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitPressed: { opacity: 0.85 },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
});

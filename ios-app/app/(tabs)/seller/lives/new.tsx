import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { PhotoSourceSheet } from "@/components/PhotoSourceSheet";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

/**
 * Default start time for a new live: tomorrow at 20:00 local — a sensible
 * placeholder that's guaranteed to pass the "must be in the future" check.
 */
function defaultStartsAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(20, 0, 0, 0);
  return d;
}

/** Merge the date part of `picked` into `base`, keeping `base`'s time. */
function withDate(base: Date, picked: Date): Date {
  const d = new Date(base);
  d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return d;
}

/** Merge the time part of `picked` into `base`, keeping `base`'s date. */
function withTime(base: Date, picked: Date): Date {
  const d = new Date(base);
  d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return d;
}

export default function SellerLiveNewScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState<Date>(defaultStartsAt);
  const [description, setDescription] = useState("");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [coverSheetOpen, setCoverSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleMutation = trpc.live.schedule.useMutation();
  const uploadMutation = trpc.image.upload.useMutation();

  const onChangeDate = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setStartsAt((prev) => withDate(prev, picked));
  };
  const onChangeTime = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setStartsAt((prev) => withTime(prev, picked));
  };

  const pickFromLibrary = async () => {
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
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

  const pickCover = () => setCoverSheetOpen(true);

  const handleSubmit = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError("Le nom doit contenir au moins 3 caractères");
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
      setError(
        e instanceof Error ? e.message : "Erreur lors de la planification",
      );
    }
  };

  const isSubmitting = scheduleMutation.isPending || uploadMutation.isPending;

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
                <Text style={styles.coverHint}>
                  Ajouter une image de couverture
                </Text>
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
              <Field label="Date *">
                <DateTimePicker
                  value={startsAt}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  locale="fr-FR"
                  // Force light mode so the popover calendar matches the form
                  // instead of iOS 26's dark Liquid Glass default, and the
                  // value text gets a high-contrast foreground.
                  themeVariant="light"
                  onChange={onChangeDate}
                />
              </Field>
            </View>
            <View style={styles.col}>
              <Field label="Heure *">
                <DateTimePicker
                  value={startsAt}
                  mode="time"
                  display="default"
                  locale="fr-FR"
                  themeVariant="light"
                  onChange={onChangeTime}
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

      <PhotoSourceSheet
        visible={coverSheetOpen}
        onClose={() => setCoverSheetOpen(false)}
        onTakePhoto={takePhoto}
        onPickFromLibrary={pickFromLibrary}
      />
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

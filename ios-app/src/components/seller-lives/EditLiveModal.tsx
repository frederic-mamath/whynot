import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Live = {
  id: number;
  name: string;
  description: string | null;
  starts_at: string | Date;
};

type Props = {
  live: Live;
  visible: boolean;
  onClose: () => void;
};

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

export function EditLiveModal({ live, visible, onClose }: Props) {
  const initialDate =
    typeof live.starts_at === "string"
      ? new Date(live.starts_at)
      : live.starts_at;
  const [name, setName] = useState(live.name);
  const [description, setDescription] = useState(live.description ?? "");
  const [startsAt, setStartsAt] = useState<Date>(initialDate);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const updateMutation = trpc.live.update.useMutation(useMutationWithToast());

  useEffect(() => {
    if (visible) {
      setName(live.name);
      setDescription(live.description ?? "");
      setStartsAt(
        typeof live.starts_at === "string"
          ? new Date(live.starts_at)
          : live.starts_at,
      );
      setError(null);
    }
  }, [visible, live]);

  const onChangeDate = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setStartsAt((prev) => withDate(prev, picked));
  };
  const onChangeTime = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setStartsAt((prev) => withTime(prev, picked));
  };

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError("Le nom doit contenir au moins 3 caractères");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        liveId: live.id,
        name: trimmedName,
        description: description.trim() || null,
        startsAt: startsAt.toISOString(),
      });
      void utils.live.get.invalidate({ channelId: live.id });
      void utils.live.listByHost.invalidate();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <X size={24} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.title}>Modifier le live</Text>
          <View style={styles.iconBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.field}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.inputHint}
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.label}>Date *</Text>
                <DateTimePicker
                  value={startsAt}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  locale="fr-FR"
                  // Tints the iOS pill so it doesn't look greyed-out/disabled.
                  // Force light mode so the popover calendar matches the form
                  // instead of iOS 26's dark Liquid Glass default, and the
                  // value text gets a high-contrast foreground (was failing
                  // WCAG AA on the time pill).
                  themeVariant="light"
                  onChange={onChangeDate}
                />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.label}>Heure *</Text>
                <DateTimePicker
                  value={startsAt}
                  mode="time"
                  display="default"
                  locale="fr-FR"
                  themeVariant="light"
                  onChange={onChangeTime}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={Colors.inputHint}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.savePressed,
                updateMutation.isPending && styles.saveDisabled,
              ]}
              disabled={updateMutation.isPending}
              onPress={handleSave}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <Text style={styles.saveText}>Enregistrer</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
  iconBtn: { padding: Spacing.xs, width: 32, alignItems: "center" },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  field: { gap: Spacing.xs },
  fieldRow: { flexDirection: "row", gap: Spacing.md },
  fieldCol: { flex: 1, gap: Spacing.xs },
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
  textarea: { minHeight: 100, textAlignVertical: "top" },
  errorText: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.sm,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  savePressed: { opacity: 0.85 },
  saveDisabled: { opacity: 0.6 },
  saveText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
  },
});

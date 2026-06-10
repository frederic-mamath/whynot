/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-010 (cache strategy sweep) */
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Props = { onSuccess: () => void };

export function PersonalInfoForm({ onSuccess }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const utils = trpc.useUtils();
  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.me.invalidate();
      onSuccess();
    },
  });

  const save = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    updateMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Prénom</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Prénom"
        autoCapitalize="words"
      />
      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Nom"
        autoCapitalize="words"
      />
      {updateMutation.error && (
        <Text style={styles.error}>{updateMutation.error.message}</Text>
      )}
      <Pressable
        style={[styles.button, updateMutation.isPending && styles.buttonDisabled]}
        onPress={save}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <ActivityIndicator color={Colors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>Enregistrer</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: Typography.fontSize.xs, color: Colors.mutedForeground, fontWeight: "500" },
  input: {
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.foreground,
    backgroundColor: Colors.input,
  },
  error: { fontSize: Typography.fontSize.xs, color: Colors.destructive },
  button: {
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.primaryForeground, fontSize: Typography.fontSize.sm, fontWeight: "600" },
});

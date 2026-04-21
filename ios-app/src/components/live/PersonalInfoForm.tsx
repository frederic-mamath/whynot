import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";

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
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enregistrer</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  error: { fontSize: 13, color: "#EF4444" },
  button: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

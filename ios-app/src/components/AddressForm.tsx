import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Switch,
  ScrollView,
} from "react-native";

export type AddressFormValues = {
  label: string;
  street: string;
  street2: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
};

type Props = {
  initial?: Partial<AddressFormValues>;
  submitLabel: string;
  isPending: boolean;
  errorMessage?: string | null;
  onSubmit: (values: AddressFormValues) => void;
};

export function AddressForm({
  initial,
  submitLabel,
  isPending,
  errorMessage,
  onSubmit,
}: Props) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [street2, setStreet2] = useState(initial?.street2 ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [zipCode, setZipCode] = useState(initial?.zipCode ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    setLocalError(null);
    if (!label.trim() || !street.trim() || !city.trim() || !zipCode.trim()) {
      setLocalError("Tous les champs marqués obligatoires doivent être remplis.");
      return;
    }
    if (!/^\d{5}$/.test(zipCode.trim())) {
      setLocalError("Le code postal doit comporter 5 chiffres.");
      return;
    }
    onSubmit({
      label: label.trim(),
      street: street.trim(),
      street2: street2.trim(),
      city: city.trim(),
      zipCode: zipCode.trim(),
      isDefault,
    });
  };

  const error = localError ?? errorMessage ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Libellé *</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="Maison, Travail…"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Rue *</Text>
      <TextInput
        style={styles.input}
        value={street}
        onChangeText={setStreet}
        placeholder="12 rue de la Paix"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Complément (optionnel)</Text>
      <TextInput
        style={styles.input}
        value={street2}
        onChangeText={setStreet2}
        placeholder="Appartement, étage…"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Ville *</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Paris"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Code postal *</Text>
      <TextInput
        style={styles.input}
        value={zipCode}
        onChangeText={setZipCode}
        placeholder="75001"
        keyboardType="number-pad"
        maxLength={5}
      />

      <Text style={styles.label}>Pays</Text>
      <View style={[styles.input, styles.disabledField]}>
        <Text style={styles.disabledFieldText}>France</Text>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Définir par défaut</Text>
        <Switch value={isDefault} onValueChange={setIsDefault} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.submitButton, isPending && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 16, gap: 8 },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 8 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  },
  disabledField: {
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  disabledFieldText: { fontSize: 15, color: "#6B7280" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
  },
  toggleLabel: { fontSize: 15, color: "#111827", fontWeight: "500" },
  error: { fontSize: 13, color: "#EF4444", marginTop: 4 },
  submitButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

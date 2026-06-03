import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { AddressForm, AddressFormValues } from "@/components/AddressForm";
import { Colors } from "@/theme/tokens";

export default function EditAddressScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const addressId = Number(id);
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = trpc.profile.addresses.list.useQuery();
  const address = data?.find((a) => a.id === addressId);

  const updateMutation = trpc.profile.addresses.update.useMutation({
    onSuccess: () => {
      utils.profile.addresses.list.invalidate();
      utils.profile.me.invalidate();
      router.back();
    },
    onError: (e) => setError(e.message),
  });

  const setDefaultMutation = trpc.profile.addresses.setDefault.useMutation({
    onSuccess: (_, input) => {
      utils.profile.addresses.list.setData(undefined, (old) =>
        old
          ? old.map((a) => ({ ...a, isDefault: a.id === input.id }))
          : old,
      );
      utils.profile.addresses.list.invalidate();
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: old.addresses.map((a) => ({
                ...a,
                isDefault: a.id === input.id,
              })),
            }
          : old,
      );
      utils.profile.me.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const deleteMutation = trpc.profile.addresses.delete.useMutation({
    onSuccess: () => {
      utils.profile.addresses.list.invalidate();
      utils.profile.me.invalidate();
      router.back();
    },
    onError: (e) => setError(e.message),
  });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!address) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFound}>Adresse introuvable.</Text>
      </View>
    );
  }

  const handleSubmit = (values: AddressFormValues) => {
    setError(null);
    updateMutation.mutate({
      id: address.id,
      label: values.label,
      street: values.street,
      street2: values.street2 || undefined,
      city: values.city,
      state: values.city,
      zipCode: values.zipCode,
      country: "FR",
    });
  };

  const handleSetDefault = () => {
    setError(null);
    setDefaultMutation.mutate({ id: address.id });
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'adresse",
      `Supprimer définitivement « ${address.label} » ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: address.id }),
        },
      ],
    );
  };

  const anyPending =
    updateMutation.isPending ||
    setDefaultMutation.isPending ||
    deleteMutation.isPending;

  return (
    <View style={styles.container}>
      <AddressForm
        initial={{
          label: address.label,
          street: address.street,
          street2: address.street2 ?? "",
          city: address.city,
          zipCode: address.zipCode,
          isDefault: address.isDefault,
        }}
        submitLabel="Enregistrer"
        isPending={updateMutation.isPending}
        errorMessage={error}
        onSubmit={handleSubmit}
      />

      <View style={styles.actions}>
        {!address.isDefault && (
          <Pressable
            style={[styles.secondaryButton, anyPending && styles.disabled]}
            onPress={handleSetDefault}
            disabled={anyPending}
          >
            {setDefaultMutation.isPending ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Text style={styles.secondaryText}>Définir par défaut</Text>
            )}
          </Pressable>
        )}

        <Pressable
          style={[styles.deleteButton, anyPending && styles.disabled]}
          onPress={handleDelete}
          disabled={anyPending}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator color={Colors.destructive} />
          ) : (
            <Text style={styles.deleteText}>Supprimer</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  notFound: { fontSize: 15, color: Colors.mutedForeground },
  actions: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: Colors.primary, fontSize: 15, fontWeight: "600" },
  deleteButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: Colors.destructive, fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});

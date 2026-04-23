import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { PaymentSetupSheet } from "@/components/live/PaymentSetupSheet";

export default function ProfileScreen() {
  const { logout } = useAuth();

  const profileQuery = trpc.profile.me.useQuery();
  const paymentQuery = trpc.payment.getPaymentStatus.useQuery();
  const utils = trpc.useUtils();

  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showCardSetup, setShowCardSetup] = useState(false);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.me.invalidate();
      setEditingName(false);
    },
  });

  const deleteMutation = trpc.payment.deletePaymentMethod.useMutation({
    onSuccess: () => utils.payment.getPaymentStatus.invalidate(),
  });

  const profile = profileQuery.data;
  const paymentMethods = paymentQuery.data?.paymentMethods ?? [];
  const card = paymentMethods[0]?.card ?? null;
  const paymentMethodId = paymentMethods[0]?.id ?? null;

  const startEditingName = () => {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setEditingName(true);
  };

  const saveName = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    updateMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  };

  if (profileQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Profil</Text>

      {/* Account */}
      <View style={styles.section}>
        <View style={styles.accountRow}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(profile?.nickname ?? profile?.email ?? "?")[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.accountInfo}>
            {profile?.nickname && (
              <Text style={styles.nickname}>@{profile.nickname}</Text>
            )}
            <Text style={styles.email}>{profile?.email}</Text>
          </View>
        </View>
      </View>

      {/* Personal info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          {!editingName && (
            <Pressable onPress={startEditingName}>
              <Text style={styles.editLink}>Modifier</Text>
            </Pressable>
          )}
        </View>

        {editingName ? (
          <View style={styles.nameForm}>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom"
              autoCapitalize="words"
            />
            {updateMutation.error && (
              <Text style={styles.errorText}>{updateMutation.error.message}</Text>
            )}
            <View style={styles.nameActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setEditingName(false)}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, updateMutation.isPending && styles.disabled]}
                onPress={saveName}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>Enregistrer</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.nameDisplay}>
            <Row
              label="Prénom"
              value={profile?.firstName ?? "—"}
            />
            <Row
              label="Nom"
              value={profile?.lastName ?? "—"}
            />
          </View>
        )}
      </View>

      {/* Payment method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Moyen de paiement</Text>
        {card ? (
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.cardBrand}>{card.brand.toUpperCase()}</Text>
              <Text style={styles.cardDetail}>
                •••• {card.last4} — {card.expMonth}/{card.expYear}
              </Text>
            </View>
            <Pressable
              onPress={() => paymentMethodId && deleteMutation.mutate({ paymentMethodId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <Text style={styles.removeText}>Supprimer</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addCardButton} onPress={() => setShowCardSetup(true)}>
            <Text style={styles.addCardText}>+ Ajouter une carte</Text>
          </Pressable>
        )}

      <Modal
        visible={showCardSetup}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCardSetup(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCardSetup(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Ajouter une carte</Text>
          <PaymentSetupSheet onSuccess={() => setShowCardSetup(false)} />
        </View>
      </Modal>
      </View>

      {/* Log out */}
      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { fontSize: 14, color: "#6B7280" },
  value: { fontSize: 14, fontWeight: "500", color: "#111827" },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
    gap: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  editLink: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "600",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarFallback: {
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7C3AED",
  },
  accountInfo: { gap: 2 },
  nickname: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  nameDisplay: { gap: 0 },
  nameForm: { gap: 10 },
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
  errorText: { fontSize: 13, color: "#EF4444" },
  nameActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelText: { fontSize: 14, color: "#6B7280" },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    minWidth: 80,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  saveText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBrand: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.5,
  },
  cardDetail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  removeText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  addCardButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  logoutButton: {
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});

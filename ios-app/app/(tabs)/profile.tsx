/* eslint-disable @typescript-eslint/no-floating-promises, max-lines -- TODO: floating-promises removed by ticket-006; max-lines tracked separately (file >400 lines, decompose) */
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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useConfirm } from "@/hooks/useConfirm";
import { notify } from "@/lib/alerts";
import { PaymentSetupSheet } from "@/components/live/PaymentSetupSheet";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const profileQuery = trpc.profile.me.useQuery();
  const paymentQuery = trpc.payment.getPaymentStatus.useQuery();
  const utils = trpc.useUtils();

  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showCardSetup, setShowCardSetup] = useState(false);

  const updateMutation = trpc.profile.update.useMutation(
    useMutationWithToast({
      onSuccess: (_, input) => {
        utils.profile.me.setData(undefined, (old) =>
          old
            ? {
                ...old,
                firstName: input.firstName ?? old.firstName,
                lastName: input.lastName ?? old.lastName,
              }
            : old,
        );
        utils.profile.me.invalidate();
        setEditingName(false);
      },
    }),
  );

  const deleteMutation = trpc.payment.deletePaymentMethod.useMutation(
    useMutationWithToast({
      onSuccess: (_, input) => {
        utils.payment.getPaymentStatus.setData(undefined, (old) => {
          if (!old) return old;
          const filtered = old.paymentMethods.filter(
            (pm) => pm.id !== input.paymentMethodId,
          );
          return {
            ...old,
            paymentMethods: filtered,
            hasPaymentMethod: filtered.length > 0,
          };
        });
        utils.payment.getPaymentStatus.invalidate();
      },
    }),
  );

  const deletionBlockers = trpc.auth.deletionBlockers.useQuery(undefined, {
    enabled: false,
  });

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation(
    useMutationWithToast({
      onSuccess: () => logout(),
    }),
  );

  const confirmDeleteAccount = useConfirm({
    title: "Supprimer mon compte",
    message:
      "Cette action est irréversible. Toutes tes données seront supprimées définitivement.",
    destructiveLabel: "Supprimer définitivement",
  });

  const handleDeleteAccount = () => {
    confirmDeleteAccount(() => deleteAccountMutation.mutate());
  };

  const reasonLabel = (reason: string) => {
    if (reason === "payment_pending") return "paiement en attente";
    if (reason === "delivery_pending") return "livraison en cours";
    return "expédition en attente";
  };

  const handleRequestDelete = async () => {
    const result = await deletionBlockers.refetch();
    const blockers = result.data?.blockers ?? [];
    if (blockers.length > 0) {
      const message = blockers
        .map((b) => `${b.productName} — ${reasonLabel(b.reason)}`)
        .join("\n");
      notify({ title: "Suppression impossible", message, buttonLabel: "Compris" });
    } else {
      handleDeleteAccount();
    }
  };

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
        <ActivityIndicator size="large" color={Colors.primary} />
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
                  <ActivityIndicator color={Colors.primaryForeground} size="small" />
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
                <ActivityIndicator color={Colors.destructive} size="small" />
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
        onRequestClose={() => { Keyboard.dismiss(); setShowCardSetup(false); }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => { Keyboard.dismiss(); setShowCardSetup(false); }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKav}
            pointerEvents="box-none"
          >
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter une carte</Text>
                <Pressable
                  onPress={() => { Keyboard.dismiss(); setShowCardSetup(false); }}
                  style={styles.modalClose}
                  hitSlop={12}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <PaymentSetupSheet onSuccess={() => setShowCardSetup(false)} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      </View>

      {/* Delivery address */}
      <Pressable style={styles.section} onPress={() => router.push("/address")}>
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryTextWrap}>
            <Text style={styles.sectionTitle}>Adresse de livraison</Text>
            <Text style={styles.deliverySub}>
              Gère tes adresses et points relais
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      {/* Log out */}
      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>

      {/* Delete account */}
      <Pressable
        style={[styles.deleteButton, (deleteAccountMutation.isPending || deletionBlockers.isFetching) && styles.disabled]}
        onPress={handleRequestDelete}
        disabled={deleteAccountMutation.isPending || deletionBlockers.isFetching}
      >
        {deleteAccountMutation.isPending ? (
          <ActivityIndicator color={Colors.destructive} size="small" />
        ) : (
          <Text style={styles.deleteText}>Supprimer mon compte</Text>
        )}
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  label: { fontSize: Typography.fontSize.sm, color: Colors.mutedForeground },
  value: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.foreground },
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  pageTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.foreground,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.foreground,
  },
  editLink: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Radius["4xl"],
  },
  avatarFallback: {
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  accountInfo: { gap: 2 },
  nickname: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.foreground,
  },
  email: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  nameDisplay: { gap: 0 },
  nameForm: { gap: 10 },
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
  errorText: { fontSize: Typography.fontSize.xs, color: Colors.destructive },
  nameActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: { fontSize: Typography.fontSize.sm, color: Colors.mutedForeground },
  saveButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    minWidth: 80,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  saveText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.primaryForeground },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBrand: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.foreground,
    letterSpacing: 0.5,
  },
  cardDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  removeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.destructive,
    fontWeight: Typography.fontWeight.semibold,
  },
  addCardButton: {
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalKav: {
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.foreground,
  },
  modalClose: {
    width: 28,
    height: 28,
    borderRadius: Radius.xl,
    backgroundColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.mutedForeground,
    fontWeight: Typography.fontWeight.semibold,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deliveryTextWrap: { gap: 2, flex: 1 },
  deliverySub: { fontSize: Typography.fontSize.xs, color: Colors.mutedForeground },
  chevron: { fontSize: Typography.fontSize["3xl"], color: Colors.inputHint, fontWeight: Typography.fontWeight.regular },
  logoutButton: {
    marginHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.destructive,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  logoutText: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  deleteButton: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  deleteText: {
    color: Colors.inputHint,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textDecorationLine: "underline",
  },
});

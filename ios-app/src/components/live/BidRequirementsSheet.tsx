import { View, Text, Modal, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { trpc } from "@/lib/trpc";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { PaymentSetupSheet } from "./PaymentSetupSheet";

type Props = {
  visible: boolean;
  auctionId: string;
  bidAmount: number;
  onClose: () => void;
  onBidPlaced: () => void;
};

export function BidRequirementsSheet({
  visible,
  auctionId,
  bidAmount,
  onClose,
  onBidPlaced,
}: Props) {
  const profileQuery = trpc.profile.me.useQuery(undefined, { enabled: visible });
  const paymentQuery = trpc.payment.getPaymentStatus.useQuery(undefined, { enabled: visible });

  const placeBidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: onBidPlaced,
  });

  const hasName = !!(profileQuery.data?.firstName && profileQuery.data?.lastName);
  const hasPayment = paymentQuery.data?.hasPaymentMethod ?? false;
  const isLoading = profileQuery.isLoading || paymentQuery.isLoading;
  const bothMet = hasName && hasPayment;

  const confirmBid = () => {
    placeBidMutation.mutate({ auctionId, amount: bidAmount });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Préparer votre enchère</Text>
        <Text style={styles.amount}>{bidAmount.toFixed(2)} €</Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : (
            <View style={styles.sections}>
              {/* Name requirement */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.check}>{hasName ? "✓" : "✗"}</Text>
                  <Text style={[styles.sectionTitle, hasName && styles.sectionDone]}>
                    Nom complet
                  </Text>
                </View>
                {!hasName && <PersonalInfoForm onSuccess={() => {}} />}
              </View>

              {/* Payment requirement */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.check}>{hasPayment ? "✓" : "✗"}</Text>
                  <Text style={[styles.sectionTitle, hasPayment && styles.sectionDone]}>
                    Moyen de paiement
                  </Text>
                </View>
                {!hasPayment && <PaymentSetupSheet onSuccess={() => {}} />}
              </View>
            </View>
          )}
        </ScrollView>

        {placeBidMutation.error && (
          <Text style={styles.error}>{placeBidMutation.error.message}</Text>
        )}

        <Pressable
          style={[styles.confirmButton, (!bothMet || placeBidMutation.isPending) && styles.buttonDisabled]}
          onPress={confirmBid}
          disabled={!bothMet || placeBidMutation.isPending}
        >
          {placeBidMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>
              {bothMet ? "Confirmer l'enchère" : "Complétez les étapes ci-dessus"}
            </Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 16,
  },
  scroll: { flexGrow: 0 },
  sections: { gap: 20 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  check: { fontSize: 16, fontWeight: "700", width: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  sectionDone: { color: "#10B981" },
  error: {
    fontSize: 13,
    color: "#EF4444",
    marginTop: 8,
    textAlign: "center",
  },
  confirmButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonDisabled: { backgroundColor: "#D1D5DB" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

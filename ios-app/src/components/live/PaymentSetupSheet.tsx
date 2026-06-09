import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { CardField } from "@stripe/stripe-react-native";
import { usePopupSetupIntent } from "@/lib/stripe";
import { Colors } from "@/theme/tokens";

type Props = { onSuccess: () => void };

export function PaymentSetupSheet({ onSuccess }: Props) {
  const {
    saveCard,
    saveWithPlatformPay,
    isPlatformPayAvailable,
    platformPayLabel,
    isLoading,
  } = usePopupSetupIntent();

  const handleSaveCard = async () => {
    const { success } = await saveCard();
    if (success) onSuccess();
  };

  const handleSaveWithPlatformPay = async () => {
    const { success } = await saveWithPlatformPay();
    if (success) onSuccess();
  };

  return (
    <View style={styles.container}>
      {isPlatformPayAvailable && (
        <Pressable
          style={[styles.platformPayButton, isLoading && styles.buttonDisabled]}
          onPress={handleSaveWithPlatformPay}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.foreground} />
          ) : (
            <Text style={styles.platformPayText}>{platformPayLabel}</Text>
          )}
        </Pressable>
      )}

      {isPlatformPayAvailable && (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      <Text style={styles.label}>Numéro de carte</Text>
      <CardField
        postalCodeEnabled={false}
        style={styles.cardField}
        cardStyle={{ backgroundColor: Colors.input, textColor: Colors.foreground, borderRadius: 10 }}
      />
      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSaveCard}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primaryForeground} />
        ) : (
          <Text style={styles.buttonText}>Enregistrer la carte</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  platformPayButton: {
    height: 50,
    borderRadius: 10,
    // Apple Pay brand guidelines require a black button on iOS
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  platformPayText: { color: Colors.foreground, fontSize: 17, fontWeight: "600" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.mutedForeground },
  label: { fontSize: 13, color: Colors.mutedForeground, fontWeight: "500" },
  cardField: { height: 50, marginVertical: 4 },
  button: {
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.primaryForeground, fontSize: 15, fontWeight: "600" },
});

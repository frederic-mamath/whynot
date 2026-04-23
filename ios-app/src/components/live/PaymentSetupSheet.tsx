import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { CardField, useStripe, usePlatformPay, PlatformPay } from "@stripe/stripe-react-native";
import { trpc } from "@/lib/trpc";

type Props = { onSuccess: () => void };

export function PaymentSetupSheet({ onSuccess }: Props) {
  const { confirmSetupIntent } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPaySetupIntent } = usePlatformPay();
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const createSetupIntent = trpc.payment.createSetupIntent.useMutation();

  useEffect(() => {
    isPlatformPaySupported().then(setApplePayAvailable);
  }, [isPlatformPaySupported]);

  const saveWithApplePay = async () => {
    setError(null);
    setLoading(true);
    try {
      const { clientSecret } = await createSetupIntent.mutateAsync();
      const { error: applePayError } = await confirmPlatformPaySetupIntent(clientSecret, {
        applePay: {
          merchantCountryCode: "FR",
          currencyCode: "EUR",
          cartItems: [
            {
              paymentType: PlatformPay.PaymentType.Immediate,
              label: "Popup",
              amount: "0.00",
            },
          ],
        },
      });
      if (applePayError) {
        setError(applePayError.message ?? "Apple Pay annulé.");
      } else {
        utils.payment.getPaymentStatus.invalidate();
        onSuccess();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const saveWithCard = async () => {
    setError(null);
    setLoading(true);
    try {
      const { clientSecret } = await createSetupIntent.mutateAsync();
      const result = await confirmSetupIntent(clientSecret, {
        paymentMethodType: "Card",
      });
      if (result.error) {
        setError(result.error.message ?? "Erreur lors de l'enregistrement.");
      } else {
        utils.payment.getPaymentStatus.invalidate();
        onSuccess();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {applePayAvailable && (
        <Pressable
          style={[styles.applePayButton, loading && styles.buttonDisabled]}
          onPress={saveWithApplePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applePayText}>  Payer avec Apple Pay</Text>
          )}
        </Pressable>
      )}

      {applePayAvailable && (
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
        cardStyle={{ backgroundColor: "#F9FAFB", textColor: "#111827", borderRadius: 10 }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={saveWithCard}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Enregistrer la carte</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  applePayButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  applePayText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 13, color: "#9CA3AF" },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  cardField: { height: 50, marginVertical: 4 },
  error: { fontSize: 13, color: "#EF4444" },
  button: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

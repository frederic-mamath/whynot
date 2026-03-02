import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { trpc } from "@/lib/trpc";

export function usePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const createPaymentIntentMutation =
    trpc.order.createPaymentIntent.useMutation();

  const pay = useCallback(
    async (orderId: string): Promise<boolean> => {
      setLoading(true);
      try {
        // 1. Get client secret from backend
        const { clientSecret } = await createPaymentIntentMutation.mutateAsync({
          orderId,
        });

        if (!clientSecret) {
          Alert.alert("Error", "Could not initialize payment.");
          return false;
        }

        // 2. Initialize PaymentSheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: "WhyNot",
          allowsDelayedPaymentMethods: false,
        });

        if (initError) {
          Alert.alert("Error", initError.message);
          return false;
        }

        // 3. Present PaymentSheet
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code === "Canceled") {
            // User cancelled — not an error
            return false;
          }
          Alert.alert("Payment Failed", presentError.message);
          return false;
        }

        // 4. Payment succeeded
        utils.order.getMyOrders.invalidate();
        return true;
      } catch (error: any) {
        Alert.alert("Error", error?.message ?? "Payment failed.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [initPaymentSheet, presentPaymentSheet, createPaymentIntentMutation, utils],
  );

  return { pay, loading };
}

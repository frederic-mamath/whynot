// Single public Stripe surface for the iOS app. Wraps the
// `createPaymentIntent` / `initPaymentSheet` / `presentPaymentSheet` dance for
// checkouts and the `createSetupIntent` / `confirmSetupIntent` (+ Platform Pay)
// dance for card setup. Errors surface through ErrorBanner via
// useMutationWithToast. Merchant identifiers live here so they can never drift
// between Apple Pay entitlements, the StripeProvider runtime config, and the
// app.config.ts plugin args.

import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  PlatformPay,
  useStripe,
  usePlatformPay,
} from "@stripe/stripe-react-native";
import { trpc } from "@/lib/trpc";
import { useErrorBanner } from "@/hooks/useErrorBanner";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useTrack } from "@/lib/analytics";

export const MERCHANT_NAME = "Popup";
export const MERCHANT_COUNTRY = "FR";
export const MERCHANT_CURRENCY = "EUR";

export type PayResult = { success: boolean; error?: string };

export function usePopupCheckout() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { showError } = useErrorBanner();
  const track = useTrack();
  const utils = trpc.useUtils();

  const createPaymentIntent = trpc.order.createPaymentIntent.useMutation(
    useMutationWithToast(),
  );

  const pay = async (orderId: string, amount: number): Promise<PayResult> => {
    let intent: Awaited<
      ReturnType<typeof createPaymentIntent.mutateAsync>
    >;
    try {
      intent = await createPaymentIntent.mutateAsync({ orderId });
    } catch {
      // useMutationWithToast already surfaced the error via banner.
      return { success: false };
    }

    const { clientSecret, customerId, ephemeralKey } = intent;

    const initResult = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret ?? "",
      merchantDisplayName: MERCHANT_NAME,
      ...(customerId && ephemeralKey
        ? { customerId, customerEphemeralKeySecret: ephemeralKey }
        : {}),
    });
    if (initResult.error) {
      showError(initResult.error.message);
      return { success: false, error: initResult.error.message };
    }

    track({ name: "checkout_started", orderId, amount });
    const result = await presentPaymentSheet();
    if (result.error) {
      // Stripe surfaces a "Canceled" error when the user dismisses the sheet —
      // that's not an error to show.
      if (result.error.code !== "Canceled") {
        showError(result.error.message);
        return { success: false, error: result.error.message };
      }
      return { success: false };
    }

    track({ name: "purchase_completed", orderId, amount });
    void utils.order.getMyOrders.invalidate();
    return { success: true };
  };

  return { pay };
}

export function usePopupSetupIntent() {
  const { confirmSetupIntent } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPaySetupIntent } =
    usePlatformPay();
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useErrorBanner();
  const utils = trpc.useUtils();

  const createSetupIntent = trpc.payment.createSetupIntent.useMutation(
    useMutationWithToast(),
  );

  useEffect(() => {
    void isPlatformPaySupported().then(setIsPlatformPayAvailable);
  }, [isPlatformPaySupported]);

  const platformPayLabel =
    Platform.OS === "ios" ? "Payer avec Apple Pay" : "Payer avec Google Pay";

  const saveCard = async (): Promise<{ success: boolean }> => {
    setIsLoading(true);
    try {
      let intent: Awaited<ReturnType<typeof createSetupIntent.mutateAsync>>;
      try {
        intent = await createSetupIntent.mutateAsync();
      } catch {
        return { success: false };
      }
      const result = await confirmSetupIntent(intent.clientSecret, {
        paymentMethodType: "Card",
      });
      if (result.error) {
        showError(result.error.message ?? "Erreur lors de l'enregistrement.");
        return { success: false };
      }
      void utils.payment.getPaymentStatus.invalidate();
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const saveWithPlatformPay = async (): Promise<{ success: boolean }> => {
    setIsLoading(true);
    try {
      let intent: Awaited<ReturnType<typeof createSetupIntent.mutateAsync>>;
      try {
        intent = await createSetupIntent.mutateAsync();
      } catch {
        return { success: false };
      }
      const { error: platformPayError } =
        Platform.OS === "ios"
          ? await confirmPlatformPaySetupIntent(intent.clientSecret, {
              applePay: {
                merchantCountryCode: MERCHANT_COUNTRY,
                currencyCode: MERCHANT_CURRENCY,
                cartItems: [
                  {
                    paymentType: PlatformPay.PaymentType.Immediate,
                    label: MERCHANT_NAME,
                    amount: "0.00",
                  },
                ],
              },
            })
          : await confirmPlatformPaySetupIntent(intent.clientSecret, {
              googlePay: {
                testEnv: __DEV__,
                merchantName: MERCHANT_NAME,
                merchantCountryCode: MERCHANT_COUNTRY,
                currencyCode: MERCHANT_CURRENCY,
              },
            });
      if (platformPayError) {
        showError(platformPayError.message ?? "Paiement annulé.");
        return { success: false };
      }
      void utils.payment.getPaymentStatus.invalidate();
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveCard,
    saveWithPlatformPay,
    isPlatformPayAvailable,
    platformPayLabel,
    isLoading,
  };
}

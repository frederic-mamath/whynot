import React from "react";
import { Platform } from "react-native";
import { StripeProvider as RNStripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

type Props = { children: React.ReactElement | React.ReactElement[] };

export function StripeProvider({ children }: Props) {
  const publishableKey =
    (Constants.expoConfig?.extra?.stripePublishableKey as string) ?? "";
  const merchantIdentifier =
    Platform.OS === "ios"
      ? ((Constants.expoConfig?.extra?.applePayMerchantId as string) ?? "")
      : undefined;

  return (
    <RNStripeProvider
      publishableKey={publishableKey}
      merchantIdentifier={merchantIdentifier}
    >
      {children}
    </RNStripeProvider>
  );
}

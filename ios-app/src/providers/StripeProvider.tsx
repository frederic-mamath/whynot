import React from "react";
import { StripeProvider as RNStripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

type Props = { children: React.ReactElement | React.ReactElement[] };

export function StripeProvider({ children }: Props) {
  const publishableKey =
    (Constants.expoConfig?.extra?.stripePublishableKey as string) ?? "";

  return (
    <RNStripeProvider publishableKey={publishableKey}>
      {children}
    </RNStripeProvider>
  );
}

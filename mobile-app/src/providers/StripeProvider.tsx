import { StripeProvider as NativeStripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

const PUBLISHABLE_KEY =
  Constants.expoConfig?.extra?.stripePublishableKey ??
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  "";

export function StripeProvider({ children }: { children: React.ReactElement }) {
  return (
    <NativeStripeProvider
      publishableKey={PUBLISHABLE_KEY}
      merchantIdentifier="merchant.fr.mamath.whynot"
    >
      {children}
    </NativeStripeProvider>
  );
}

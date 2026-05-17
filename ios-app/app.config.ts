import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Popup",
  slug: "popup-ios",
  version: "1.0.2",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "popup",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "fr.mamath.popup",
    infoPlist: {
      NSCameraUsageDescription: "Popup utilise la caméra pour les lives vidéo.",
      NSMicrophoneUsageDescription:
        "Popup utilise le micro pour les lives vidéo.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "fr.mamath.popup",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "@stripe/stripe-react-native",
      { merchantIdentifier: "merchant.fr.popup-live" },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Dev: http://localhost:3000 (Simulator) or http://<local-ip>:3000 (physical device)
    // Prod/staging: https://api.whynot.mamath.fr
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:3000",
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    applePayMerchantId: process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID ?? "",
    eas: {
      projectId: "e4fb598f-33f8-45f1-859b-33581a264e81",
    },
  },
});

import { ExpoConfig, ConfigContext } from "expo/config";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

// Regenerate design tokens on every Expo config evaluation (prebuild / start / run).
// Wrapped so a generator failure never blocks the dev workflow — stale tokens are
// preferable to a crashed `expo run`.
try {
  execSync(`node ${resolve(__dirname, "../design-tokens/generate.mjs")}`, {
    stdio: "inherit",
  });
} catch (err) {
  console.warn("[app.config] design-tokens generator failed:", err);
}

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const googleIosUrlScheme = googleIosClientId
  ? `com.googleusercontent.apps.${googleIosClientId.split(".")[0]}`
  : "";

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
  updates: {
    url: "https://u.expo.dev/e4fb598f-33f8-45f1-859b-33581a264e81",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "fr.mamath.popup",
    usesAppleSignIn: true,
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
    "expo-apple-authentication",
    ...(googleIosUrlScheme
      ? [
          [
            "@react-native-google-signin/google-signin",
            { iosUrlScheme: googleIosUrlScheme },
          ] as [string, { iosUrlScheme: string }],
        ]
      : []),
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
    googleIosClientId,
    googleAndroidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
    eas: {
      projectId: "e4fb598f-33f8-45f1-859b-33581a264e81",
    },
  },
});

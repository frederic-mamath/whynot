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
  version: "1.1.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "popup",
  // App is dark-only — see features/072-ios-dark-palette/summary.md.
  // Locking userInterfaceStyle to "dark" forces native surfaces (status bar,
  // action sheets, alerts, system pickers) to render dark before any JS runs.
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  // Splash is configured via the expo-splash-screen plugin below — the modern
  // form. The legacy top-level `splash:` block left the asset's baked-in black
  // square framed by white bars on portrait phones.
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
    "@react-native-community/datetimepicker",
    [
      "expo-splash-screen",
      {
        // Full-bleed dark splash. backgroundColor matches the asset's baked-in
        // background so there are no light bars top/bottom on portrait.
        // imageWidth keeps the wordmark a polished size instead of stretching
        // to the screen width.
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#000000",
        imageWidth: 200,
      },
    ],
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
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "",
    posthogHost:
      process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    eas: {
      projectId: "e4fb598f-33f8-45f1-859b-33581a264e81",
    },
  },
});

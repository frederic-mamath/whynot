import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Dynamic Expo config — reads from .env automatically (Expo SDK 49+).
 *
 * Dev:  API_URL=http://192.168.X.X:3000 in .env
 * Prod: API_URL not set → falls back to https://popup-live.fr
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Popup",
  slug: "popup",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "popup",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "fr.popup-live",
    infoPlist: {
      NSCameraUsageDescription:
        "Popup needs access to your camera to host live streams and take product photos.",
      NSMicrophoneUsageDescription:
        "Popup needs access to your microphone to host live streams.",
      NSPhotoLibraryUsageDescription:
        "Popup needs access to your photo library to upload product images.",
    },
  },
  android: {
    package: "fr.popup-live",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    permissions: ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.fr.popup-live",
        enableGooglePay: true,
      },
    ],
  ],
  extra: {
    // Reads API_URL from .env — falls back to production if not set
    apiUrl: process.env.API_URL ?? "https://popup-live.fr",
    // Reads WS_URL from .env — derived from apiUrl if not set
    wsUrl:
      process.env.WS_URL ??
      (process.env.API_URL
        ? process.env.API_URL.replace(/^http/, "ws")
        : "wss://popup-live.fr"),
    stripePublishableKey:
      process.env.STRIPE_PUBLISHABLE_KEY ??
      "pk_test_51RX5wpFpXSJuaxQVgRq7ESvBfZuVGMUC50zBcr8lWtlaiSPjd4FShApmDX7BDlY9UYQ2vTrMpLoPvvdgZNvGythr00ge5JIFoi",
    eas: {
      projectId: "50620817-a61d-4545-8091-6566e41f711f",
    },
    router: {},
  },
  owner: "frederic-mamath",
});

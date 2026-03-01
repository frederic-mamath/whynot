// Initialize Unistyles (themes + breakpoints) — must be imported before any component
import "@/lib/unistyles";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Root layout — wraps the entire app with providers.
 * Expo Router renders this layout for ALL routes.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaProvider>
  );
}

// Initialize Unistyles (themes + breakpoints) — must be imported before any component
import "@/lib/unistyles";

import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "@/providers/TRPCProvider";
import { StripeProvider } from "@/providers/StripeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkAlert } from "@/components/NetworkAlert";

/**
 * Handles auth-based navigation redirect.
 * - Not authenticated → redirect to /(auth)/login
 * - Authenticated and on auth screens → redirect to /
 */
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

/**
 * Root layout — wraps the entire app with providers.
 * Expo Router renders this layout for ALL routes.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StripeProvider>
          <TRPCProvider>
            <AuthProvider>
              <StatusBar style="auto" />
              <NetworkAlert />
              <AuthGate />
            </AuthProvider>
          </TRPCProvider>
        </StripeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

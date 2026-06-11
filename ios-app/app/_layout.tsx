/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-010 (cache strategy sweep) */
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from "posthog-react-native";
import { TRPCProvider } from "@/providers/TRPCProvider";
import { StripeProvider } from "@/providers/StripeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBannerProvider } from "@/contexts/ErrorBannerContext";
import { ErrorBanner } from "@/components/ErrorBanner";
import { trpc } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export default function RootLayout() {
  const tree = (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <TRPCProvider>
        <StripeProvider>
          <AuthProvider>
            <ErrorBannerProvider>
              <RootNavigator />
              <ErrorBanner />
            </ErrorBannerProvider>
          </AuthProvider>
        </StripeProvider>
      </TRPCProvider>
    </SafeAreaProvider>
  );

  if (!POSTHOG_KEY) return tree;

  return (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{
        host: POSTHOG_HOST,
        // GDPR Option A — anonymous-until-identified, no consent banner needed.
        // Anonymous users do not get a person profile; only post-identify users do.
        personProfiles: "identified_only",
        captureAppLifecycleEvents: false,
      }}
      autocapture={false}
    >
      {tree}
    </PostHogProvider>
  );
}

function RootNavigator() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const profileQuery = trpc.profile.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const isLoading = authLoading || (!!user && profileQuery.isLoading);

  useEffect(() => {
    if (isLoading) return;
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";
    const hasOnboarded = profileQuery.data?.hasCompletedOnboarding ?? false;

    // 401 recovery lands here: when authBus → AuthContext.logout() sets
    // user to null, this effect re-fires and routes to (auth)/welcome.
    const redirect = () => {
      if (!user && !inAuthGroup) {
        router.replace("/(auth)/welcome");
      } else if (user && !hasOnboarded && !inOnboarding) {
        router.replace("/onboarding");
      } else if (user && hasOnboarded && (inAuthGroup || inOnboarding)) {
        router.replace("/(tabs)");
      }
    };

    // Defer one tick so the Stack navigator finishes registering all screens
    // before we navigate, avoiding the "(auth) not handled" dev warning.
    const t = setTimeout(redirect, 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: L3 follow-up (router missing from deps)
  }, [user, isLoading, profileQuery.data?.hasCompletedOnboarding, segments]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="live/[liveId]" />
      <Stack.Screen name="seller-live/[liveId]" />
      <Stack.Screen name="address" />
    </Stack>
  );
}

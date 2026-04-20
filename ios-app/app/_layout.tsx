import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { TRPCProvider } from "@/providers/TRPCProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <TRPCProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </TRPCProvider>
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

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (user && !hasOnboarded && !inOnboarding) {
      router.replace("/onboarding");
    } else if (user && hasOnboarded && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, profileQuery.data?.hasCompletedOnboarding, segments]);

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="live/[liveId]" />
    </Stack>
  );
}

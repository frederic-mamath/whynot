import { Stack } from "expo-router";

/**
 * Auth group layout — no header, simple stack navigation
 * between login and register screens.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}

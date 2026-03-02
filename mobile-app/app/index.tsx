import { Redirect } from "expo-router";

/**
 * Root index — redirects to the tab layout.
 * The AuthGate in _layout.tsx handles unauthenticated → login redirect.
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}

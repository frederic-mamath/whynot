import { Stack } from "expo-router";
import { Colors } from "@/theme/tokens";

export default function AddressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.foreground,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Adresse de livraison" }} />
      <Stack.Screen name="new" options={{ title: "Nouvelle adresse" }} />
      <Stack.Screen name="[id]" options={{ title: "Modifier l'adresse" }} />
      <Stack.Screen name="relay" options={{ title: "Point relais" }} />
    </Stack>
  );
}

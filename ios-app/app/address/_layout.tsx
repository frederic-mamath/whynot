import { Stack } from "expo-router";

export default function AddressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Adresse de livraison" }} />
      <Stack.Screen name="new" options={{ title: "Nouvelle adresse" }} />
      <Stack.Screen name="[id]" options={{ title: "Modifier l'adresse" }} />
    </Stack>
  );
}

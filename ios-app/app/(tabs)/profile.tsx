import { View, Text, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";

export default function ProfileScreen() {
  const { data, isLoading, error } = trpc.live.list.useQuery({ limit: 4 });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {isLoading && <Text style={styles.subtitle}>Connecting to backend…</Text>}
      {error && (
        <Text style={styles.error}>Backend error: {error.message}</Text>
      )}
      {data && (
        <Text style={styles.subtitle}>
          tRPC OK — {data.lives.length} active live(s)
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  error: {
    fontSize: 14,
    color: "#EF4444",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

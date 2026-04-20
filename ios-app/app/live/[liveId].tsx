import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function LiveScreen() {
  const { liveId } = useLocalSearchParams<{ liveId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>
      <Text style={styles.title}>Live #{liveId}</Text>
      <Text style={styles.subtitle}>Live stream — bientôt disponible</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  back: {
    position: "absolute",
    top: 60,
    left: 16,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
  },
});

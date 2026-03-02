import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Persistent banner shown at the top of the screen when the device is offline.
 * Includes a retry button that invalidates all queries when connectivity returns.
 */
export function NetworkAlert() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // null = still checking; true = online — don't show in either case
  if (isConnected !== false) return null;

  const handleRetry = () => {
    queryClient.invalidateQueries();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <WifiOff size={18} color="#fff" />
      <Text style={styles.text}>Pas de connexion internet</Text>
      <Pressable style={styles.retryButton} onPress={handleRetry}>
        <RefreshCw size={14} color="#fff" />
        <Text style={styles.retryText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#e5484d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
}));

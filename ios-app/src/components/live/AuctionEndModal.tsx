import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/theme/tokens";

type Props = {
  visible: boolean;
  isWinner: boolean;
  productName: string;
  finalPrice: number;
  winnerUsername: string | null;
  onClose: () => void;
};

export function AuctionEndModal({
  visible,
  isWinner,
  productName,
  finalPrice,
  winnerUsername,
  onClose,
}: Props) {
  const router = useRouter();

  const goToOrders = () => {
    onClose();
    router.push("/(tabs)/orders");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {isWinner ? (
            <>
              <Text style={styles.emoji}>🏆</Text>
              <Text style={styles.title}>Vous avez gagné !</Text>
              <Text style={styles.body}>
                {productName} pour {finalPrice.toFixed(2)} €
              </Text>
              <Text style={styles.sub}>Payez avant la date limite pour confirmer votre commande.</Text>
              <Pressable style={styles.primaryButton} onPress={goToOrders}>
                <Text style={styles.primaryButtonText}>Payer maintenant</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Plus tard</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>😔</Text>
              <Text style={styles.title}>Enchère terminée</Text>
              <Text style={styles.body}>
                Vendu à {winnerUsername ?? "un acheteur"} pour {finalPrice.toFixed(2)} €
              </Text>
              <Pressable style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>Continuer</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.foreground, textAlign: "center" },
  body: { fontSize: 16, color: Colors.foreground, textAlign: "center" },
  sub: { fontSize: 13, color: Colors.mutedForeground, textAlign: "center" },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 8,
  },
  primaryButtonText: { color: Colors.primaryForeground, fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  secondaryButtonText: { color: Colors.mutedForeground, fontSize: 15 },
});

import { View, Text, Pressable, Modal } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Trophy, CircleX } from "lucide-react-native";

interface AuctionEndModalProps {
  visible: boolean;
  isWinner: boolean;
  productName: string;
  finalPrice: number;
  winnerUsername: string | null;
  onClose: () => void;
  onPay?: () => void;
}

export function AuctionEndModal({
  visible,
  isWinner,
  productName,
  finalPrice,
  winnerUsername,
  onClose,
  onPay,
}: AuctionEndModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {isWinner ? (
            <Trophy size={48} color="#eab308" strokeWidth={1.5} />
          ) : (
            <CircleX
              size={48}
              color="rgba(255,255,255,0.4)"
              strokeWidth={1.5}
            />
          )}

          <Text style={styles.title}>
            {isWinner ? "You Won!" : "Auction Ended"}
          </Text>

          <Text style={styles.product}>{productName}</Text>

          <Text style={styles.price}>€{finalPrice.toFixed(2)}</Text>

          {!isWinner && winnerUsername && (
            <Text style={styles.winner}>Won by {winnerUsername}</Text>
          )}

          {isWinner && onPay ? (
            <View style={styles.actions}>
              <Pressable style={styles.payButton} onPress={onPay}>
                <Text style={styles.payText}>Pay Now</Text>
              </Pressable>
              <Pressable style={styles.laterButton} onPress={onClose}>
                <Text style={styles.laterText}>Pay Later</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  product: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: "center",
  },
  price: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  winner: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  actions: {
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  payText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  laterText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  closeText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.base,
  },
}));

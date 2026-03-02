import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface BidInputProps {
  currentBid: number;
  minIncrement?: number;
  isPending: boolean;
  onPlaceBid: (amount: number) => void;
}

export function BidInput({
  currentBid,
  minIncrement = 1,
  isPending,
  onPlaceBid,
}: BidInputProps) {
  const minBid = currentBid + minIncrement;
  const [amount, setAmount] = useState(String(minBid));

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < minBid) return;
    onPlaceBid(numAmount);
    setAmount(String(numAmount + minIncrement));
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Text style={styles.currency}>€</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!isPending}
          selectTextOnFocus
        />
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.bidButton,
          pressed && styles.bidPressed,
          isPending && styles.bidDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.bidText}>Bid</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  currency: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 10,
  },
  bidButton: {
    backgroundColor: "rgba(34, 197, 94, 0.85)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bidPressed: {
    opacity: 0.8,
  },
  bidDisabled: {
    opacity: 0.5,
  },
  bidText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
}));

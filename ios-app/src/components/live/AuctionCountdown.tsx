import { useState, useEffect } from "react";
import { Text, StyleSheet } from "react-native";

type Props = { endsAt: string };

export function AuctionCountdown({ endsAt }: Props) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () =>
      Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <Text style={[styles.text, remaining < 30 && styles.urgent]}>{display}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  urgent: {
    color: "#EF4444",
  },
});

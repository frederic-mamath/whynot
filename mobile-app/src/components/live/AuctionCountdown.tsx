import { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface AuctionCountdownProps {
  endsAt: string;
  onExpired?: () => void;
}

export function AuctionCountdown({ endsAt, onExpired }: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setTimeLeft(getTimeLeft(endsAt));

    const interval = setInterval(() => {
      const remaining = getTimeLeft(endsAt);
      setTimeLeft(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpired?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  const isUrgent = timeLeft > 0 && timeLeft <= 30;
  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;

  return (
    <View style={[styles.container, isUrgent && styles.urgent]}>
      <Text style={[styles.timer, isUrgent && styles.urgentText]}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>
    </View>
  );
}

function getTimeLeft(endsAt: string): number {
  return Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000);
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  urgent: {
    backgroundColor: "rgba(229, 72, 77, 0.8)",
  },
  timer: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  urgentText: {
    color: "#ffffff",
  },
}));

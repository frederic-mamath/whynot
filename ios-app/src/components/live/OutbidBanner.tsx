import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Props = {
  productName: string;
  newBid: number;
  onDismiss: () => void;
  onBidAgain: () => void;
};

export function OutbidBanner({ productName, newBid, onDismiss, onBidAgain }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Vibration.vibrate(50);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: L3 follow-up (translateY missing from deps; Animated.Value is stable in practice)
  }, []);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  const handleBidAgain = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
      onBidAgain();
    });
  };

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.row}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Tu as été surenchéri(e) !</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {productName} — enchère actuelle : {newBid.toFixed(2)} €
          </Text>
        </View>
        <Pressable onPress={dismiss} hitSlop={12} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      <Pressable style={styles.bidAgainButton} onPress={handleBidAgain}>
        <Text style={styles.bidAgainText}>Enchérir à nouveau</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    zIndex: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warningForeground,
  },
  sub: {
    fontSize: 12,
    color: Colors.warningForeground,
    opacity: 0.9,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 13,
    color: Colors.warningForeground,
    fontWeight: Typography.fontWeight.semibold,
  },
  bidAgainButton: {
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.warningForeground,
    alignItems: "center",
    justifyContent: "center",
  },
  bidAgainText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.warning,
  },
});

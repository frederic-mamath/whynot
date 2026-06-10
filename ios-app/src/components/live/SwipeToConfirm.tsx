import { useRef } from "react";
import {
  Animated,
  PanResponder,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

const TRACK_WIDTH = Dimensions.get("window").width / 2;
const THUMB_SIZE = 48;
const TRACK_PADDING = 4;
const MAX_X = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;

type Props = {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function SwipeToConfirm({ label, onConfirm, disabled, loading }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  // Refs so PanResponder closure always reads the latest props without recreating
  const isActiveRef = useRef(false);
  isActiveRef.current = !disabled && !loading;
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isActiveRef.current,
      onMoveShouldSetPanResponder: () => isActiveRef.current,
      onPanResponderMove: (_, { dx }) => {
        translateX.setValue(Math.max(0, Math.min(dx, MAX_X)));
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx >= MAX_X * 0.8) {
          Animated.timing(translateX, {
            toValue: MAX_X,
            duration: 100,
            useNativeDriver: true,
          }).start(() => {
            onConfirmRef.current();
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.track, (disabled || loading) && styles.trackDisabled]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={styles.thumbArrow}>›</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + TRACK_PADDING * 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: TRACK_PADDING,
  },
  trackDisabled: {
    opacity: 0.4,
  },
  label: {
    position: "absolute",
    left: THUMB_SIZE + TRACK_PADDING + Spacing.sm,
    right: TRACK_PADDING + Spacing.sm,
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: "center",
  },
  thumb: {
    position: "absolute",
    left: TRACK_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.primaryForeground,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbArrow: {
    fontSize: Typography.fontSize["2xl"],
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 28,
  },
});

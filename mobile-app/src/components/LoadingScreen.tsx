import { View, ActivityIndicator } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={styles.indicator.color} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  indicator: {
    color: theme.colors.primary,
  },
}));

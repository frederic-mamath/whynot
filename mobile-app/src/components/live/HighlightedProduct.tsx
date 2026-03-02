import { View, Text, Image, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ShoppingBag } from "lucide-react-native";

interface HighlightedProductProps {
  name: string;
  price: number;
  imageUrl: string | null;
  onPress?: () => void;
}

export function HighlightedProduct({
  name,
  price,
  imageUrl,
  onPress,
}: HighlightedProductProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <ShoppingBag size={20} color="#fff" strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.price}>€{price.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    padding: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  price: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
}));

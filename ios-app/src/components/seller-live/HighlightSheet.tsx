import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Product = { id: number; name: string; imageUrl: string | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  products: Product[];
  highlightedId: number | null;
  onSelect: (productId: number) => void;
};

export function HighlightSheet({
  visible,
  onClose,
  products,
  highlightedId,
  onSelect,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <X size={24} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.title}>Mettre un produit en avant</Text>
          <View style={styles.iconBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {products.length === 0 ? (
            <Text style={styles.empty}>Aucun produit attaché à ce live</Text>
          ) : (
            products.map((p) => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [
                  styles.row,
                  highlightedId === p.id && styles.rowActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelect(p.id)}
              >
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]} />
                )}
                <Text style={styles.rowName} numberOfLines={1}>
                  {p.name}
                </Text>
                {highlightedId === p.id && (
                  <Text style={styles.rowActiveLabel}>En avant</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBtn: { width: 32, alignItems: "center" },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.foreground,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  empty: {
    color: Colors.mutedForeground,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accent,
  },
  thumb: { width: 48, height: 48, borderRadius: Radius.sm },
  thumbFallback: { backgroundColor: Colors.muted },
  rowName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    fontWeight: "500",
  },
  rowActiveLabel: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: Typography.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.7 },
});

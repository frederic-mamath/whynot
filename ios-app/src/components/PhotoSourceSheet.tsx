import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Props = {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onPickFromLibrary: () => void;
  title?: string;
};

/**
 * Slide-up bottom sheet for choosing a photo source.
 *
 * Replaces ActionSheetIOS — on iOS 26 the redesigned action sheet renders as
 * small floating pills, which clashes with our branded UI. This sheet matches
 * the seller screens' look (purple primary, outlined secondary, rounded card).
 */
export function PhotoSourceSheet({
  visible,
  onClose,
  onTakePhoto,
  onPickFromLibrary,
  title = "Image de couverture",
}: Props) {
  const insets = useSafeAreaInsets();

  const handle = (action: () => void) => () => {
    onClose();
    // Defer the picker call so the sheet's dismiss animation can complete
    // before the camera / library modal opens. Skipping this can cause the
    // system picker to be presented under a still-dismissing modal.
    setTimeout(action, 250);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          <Text style={styles.title}>{title}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
            ]}
            onPress={handle(onTakePhoto)}
          >
            <Camera size={20} color={Colors.primaryForeground} />
            <Text style={styles.primaryText}>Prendre une photo</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
            ]}
            onPress={handle(onPickFromLibrary)}
          >
            <ImageIcon size={20} color={Colors.primary} />
            <Text style={styles.secondaryText}>Choisir depuis la galerie</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.pressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.foreground,
    textAlign: "center",
    paddingBottom: Spacing.xs,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
  },
  primaryText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cancelText: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "500",
  },
  pressed: {
    opacity: 0.75,
  },
});

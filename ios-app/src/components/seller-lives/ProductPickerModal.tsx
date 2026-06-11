import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

type Props = {
  liveId: number;
  visible: boolean;
  onClose: () => void;
  currentProductIds: Set<number>;
};

// Seller management view: must include inactive products so the picker's
// checkboxes reflect what `isAssociated` reports. Otherwise tapping an
// already-associated inactive product silently 409s.
function makeAttachedKey(liveId: number) {
  return { channelId: liveId, includeInactive: true } as const;
}

export function ProductPickerModal({
  liveId,
  visible,
  onClose,
  currentProductIds,
}: Props) {
  const utils = trpc.useUtils();
  const attachedKey = makeAttachedKey(liveId);

  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;
  const productsQuery = trpc.product.list.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: shopId !== undefined },
  );
  const products = productsQuery.data ?? [];

  const associateMutation = trpc.product.associateToChannel.useMutation(
    useMutationWithToast({
      onSuccess: () => {
        void utils.product.listByChannel.invalidate(attachedKey);
      },
    }),
  );
  const removeMutation = trpc.product.removeFromChannel.useMutation(
    useMutationWithToast({
      onMutate: async ({ productId }) => {
        await utils.product.listByChannel.cancel(attachedKey);
        const previous = utils.product.listByChannel.getData(attachedKey);
        utils.product.listByChannel.setData(attachedKey, (old) =>
          old?.filter((p) => p.id !== productId),
        );
        return { previous };
      },
      onError: (_err, _i, ctx) => {
        if (ctx?.previous) {
          utils.product.listByChannel.setData(attachedKey, ctx.previous);
        }
      },
      onSettled: () => {
        void utils.product.listByChannel.invalidate(attachedKey);
      },
    }),
  );

  const handleToggle = (productId: number, currentlyAttached: boolean) => {
    if (currentlyAttached) {
      removeMutation.mutate({ productId, channelId: liveId });
    } else {
      associateMutation.mutate({ productId, channelId: liveId });
    }
  };

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
          <Text style={styles.title}>Ajouter des produits</Text>
          <View style={styles.iconBtn} />
        </View>

        {products.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>Aucun produit dans votre inventaire</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isAttached = currentProductIds.has(item.id);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleToggle(item.id, isAttached)}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]} />
                  )}
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.checkbox,
                      isAttached && styles.checkboxChecked,
                    ]}
                  >
                    {isAttached && (
                      <Check size={16} color={Colors.primaryForeground} />
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBtn: { padding: Spacing.xs, width: 32, alignItems: "center" },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  empty: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    paddingVertical: Spacing.lg,
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
  thumb: { width: 48, height: 48, borderRadius: Radius.sm },
  thumbFallback: { backgroundColor: Colors.muted },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    fontWeight: "500",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pressed: { opacity: 0.6 },
});

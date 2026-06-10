import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Pencil, Plus, Radio, Trash2 } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useConfirm } from "@/hooks/useConfirm";
import { AttachedProductsList } from "@/components/seller-lives/AttachedProductsList";
import { EditLiveModal } from "@/components/seller-lives/EditLiveModal";
import { ProductPickerModal } from "@/components/seller-lives/ProductPickerModal";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function formatStartsAt(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} à ${hh}:${mm}`;
}

export default function SellerLiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const liveId = Number(id);
  const router = useRouter();
  const utils = trpc.useUtils();

  const liveQuery = trpc.live.get.useQuery({ channelId: liveId });
  // Seller management view: must include inactive products so the picker's
  // checkboxes reflect what `isAssociated` reports. Otherwise tapping an
  // already-associated inactive product silently 409s.
  const attachedKey = { channelId: liveId, includeInactive: true } as const;
  const attachedQuery = trpc.product.listByChannel.useQuery(attachedKey);

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
      onSettled: () => utils.product.listByChannel.invalidate(attachedKey),
    }),
  );
  const deleteLiveMutation = trpc.live.delete.useMutation(useMutationWithToast());

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const live = liveQuery.data?.channel;
  const attached = attachedQuery.data ?? [];
  const attachedIds = new Set(attached.map((p) => p.id));
  const isUpcoming = !!live && new Date(live.starts_at).getTime() > Date.now();

  const confirmDelete = useConfirm({
    title: "Supprimer ce live",
    message: live ? `"${live.name}" sera supprimé définitivement.` : "",
  });

  const handleDelete = () => {
    if (!live) return;
    void confirmDelete(async () => {
      await deleteLiveMutation.mutateAsync({ liveId });
      await utils.live.listByHost.invalidate();
      router.back();
    });
  };

  if (liveQuery.isLoading || !live) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {live.name}
        </Text>
        {isUpcoming && (
          <Pressable onPress={() => setEditOpen(true)} style={styles.iconBtn}>
            <Pencil size={20} color={Colors.foreground} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {live.cover_url && (
          <Image source={{ uri: live.cover_url }} style={styles.cover} />
        )}

        <View style={styles.metaBlock}>
          <Text style={styles.metaDate}>{formatStartsAt(live.starts_at)}</Text>
          {live.description && (
            <Text style={styles.metaDesc}>{live.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produits du live</Text>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.pressed,
              ]}
            >
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addBtnText}>Ajouter</Text>
            </Pressable>
          </View>

          <AttachedProductsList
            products={attached}
            onRemove={(productId) =>
              removeMutation.mutate({ productId, channelId: liveId })
            }
          />
        </View>

        {isUpcoming && (
          <Pressable
            style={({ pressed }) => [
              styles.goLive,
              pressed && styles.goLivePressed,
            ]}
            onPress={() => router.push(`/seller-live/${liveId}`)}
          >
            <Radio size={20} color={Colors.primaryForeground} />
            <Text style={styles.goLiveText}>Go Live</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
          onPress={handleDelete}
        >
          <Trash2 size={18} color={Colors.destructive} />
          <Text style={styles.deleteText}>Supprimer ce live</Text>
        </Pressable>
      </ScrollView>

      <ProductPickerModal
        liveId={liveId}
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentProductIds={attachedIds}
      />

      <EditLiveModal
        live={live}
        visible={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </SafeAreaView>
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
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  cover: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
  },
  metaBlock: { gap: Spacing.sm },
  metaDate: {
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    fontWeight: "600",
  },
  metaDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    lineHeight: 22,
  },
  section: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.foreground,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addBtnText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  goLive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  goLivePressed: { opacity: 0.85 },
  goLiveText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  deleteText: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
  pressed: { opacity: 0.6 },
});

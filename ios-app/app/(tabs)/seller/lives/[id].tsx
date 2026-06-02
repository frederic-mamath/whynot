import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Pencil,
  Plus,
  Radio,
  Trash2,
  X,
  Check,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

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

/** Merge the date part of `picked` into `base`, keeping `base`'s time. */
function withDate(base: Date, picked: Date): Date {
  const d = new Date(base);
  d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return d;
}

/** Merge the time part of `picked` into `base`, keeping `base`'s date. */
function withTime(base: Date, picked: Date): Date {
  const d = new Date(base);
  d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return d;
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
  // Reused as the cache key for every cancel/getData/setData/invalidate below
  // — tRPC hashes the input to derive the key, so it has to match exactly.
  const attachedKey = { channelId: liveId, includeInactive: true } as const;
  const attachedQuery = trpc.product.listByChannel.useQuery(attachedKey);
  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;
  const allProductsQuery = trpc.product.list.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: shopId !== undefined },
  );

  const associateMutation = trpc.product.associateToChannel.useMutation({
    onSuccess: () => {
      utils.product.listByChannel.invalidate(attachedKey);
    },
    onError: (err) => {
      // Surface the failure instead of swallowing it. CONFLICT used to slip
      // through silently when the cache disagreed with the server about
      // association state — the includeInactive fix above prevents that, but
      // the alert is the safety net for any future drift.
      Alert.alert("Impossible d'ajouter ce produit", err.message);
    },
  });
  const removeMutation = trpc.product.removeFromChannel.useMutation({
    onMutate: async ({ productId }) => {
      await utils.product.listByChannel.cancel(attachedKey);
      const previous = utils.product.listByChannel.getData(attachedKey);
      utils.product.listByChannel.setData(attachedKey, (old) =>
        old?.filter((p) => p.id !== productId),
      );
      return { previous };
    },
    onError: (err, _i, ctx) => {
      if (ctx?.previous) {
        utils.product.listByChannel.setData(attachedKey, ctx.previous);
      }
      Alert.alert("Impossible de retirer ce produit", err.message);
    },
    onSettled: () => utils.product.listByChannel.invalidate(attachedKey),
  });
  const deleteLiveMutation = trpc.live.delete.useMutation();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const live = liveQuery.data?.channel;
  const attached = attachedQuery.data ?? [];
  const attachedIds = new Set(attached.map((p) => p.id));
  const isUpcoming = !!live && new Date(live.starts_at).getTime() > Date.now();

  const handleDelete = () => {
    if (!live) return;
    Alert.alert(
      "Supprimer ce live",
      `"${live.name}" sera supprimé définitivement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteLiveMutation.mutateAsync({ liveId });
            await utils.live.listByHost.invalidate();
            router.back();
          },
        },
      ],
    );
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

          {attached.length === 0 ? (
            <Text style={styles.empty}>Aucun produit attaché à ce live</Text>
          ) : (
            attached.map((p) => (
              <View key={p.id} style={styles.productRow}>
                {p.imageUrl ? (
                  <Image
                    source={{ uri: p.imageUrl }}
                    style={styles.productThumb}
                  />
                ) : (
                  <View style={[styles.productThumb, styles.thumbFallback]} />
                )}
                <Text style={styles.productName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Pressable
                  onPress={() =>
                    removeMutation.mutate({
                      productId: p.id,
                      channelId: liveId,
                    })
                  }
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <X size={20} color={Colors.mutedForeground} />
                </Pressable>
              </View>
            ))
          )}
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
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={allProductsQuery.data ?? []}
        attachedIds={attachedIds}
        onToggle={(productId, currentlyAttached) => {
          if (currentlyAttached) {
            removeMutation.mutate({ productId, channelId: liveId });
          } else {
            associateMutation.mutate({ productId, channelId: liveId });
          }
        }}
      />

      <EditLiveModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        live={live}
        onSaved={() => {
          setEditOpen(false);
          utils.live.get.invalidate({ channelId: liveId });
          utils.live.listByHost.invalidate();
        }}
      />
    </SafeAreaView>
  );
}

function ProductPickerModal({
  visible,
  onClose,
  products,
  attachedIds,
  onToggle,
}: {
  visible: boolean;
  onClose: () => void;
  products: Array<{ id: number; name: string; imageUrl: string | null }>;
  attachedIds: Set<number>;
  onToggle: (productId: number, currentlyAttached: boolean) => void;
}) {
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
          <Text style={styles.headerTitle}>Ajouter des produits</Text>
          <View style={styles.iconBtn} />
        </View>

        {products.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>
              Aucun produit dans votre inventaire
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.pickerList}
            renderItem={({ item }) => {
              const isAttached = attachedIds.has(item.id);
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.pickerRow,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onToggle(item.id, isAttached)}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.productThumb}
                    />
                  ) : (
                    <View style={[styles.productThumb, styles.thumbFallback]} />
                  )}
                  <Text style={styles.productName} numberOfLines={1}>
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

function EditLiveModal({
  visible,
  onClose,
  live,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  live: {
    id: number;
    name: string;
    description: string | null;
    starts_at: string | Date;
  };
  onSaved: () => void;
}) {
  const initialDate =
    typeof live.starts_at === "string"
      ? new Date(live.starts_at)
      : live.starts_at;
  const [name, setName] = useState(live.name);
  const [description, setDescription] = useState(live.description ?? "");
  const [startsAt, setStartsAt] = useState<Date>(initialDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(live.name);
      setDescription(live.description ?? "");
      setStartsAt(
        typeof live.starts_at === "string"
          ? new Date(live.starts_at)
          : live.starts_at,
      );
      setError(null);
    }
  }, [visible, live]);

  const onChangeDate = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setStartsAt((prev) => withDate(prev, picked));
  };
  const onChangeTime = (_: DateTimePickerEvent, picked?: Date) => {
    if (picked) setStartsAt((prev) => withTime(prev, picked));
  };

  const updateMutation = trpc.live.update.useMutation();

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError("Le nom doit contenir au moins 3 caractères");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        liveId: live.id,
        name: trimmedName,
        description: description.trim() || null,
        startsAt: startsAt.toISOString(),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
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
          <Text style={styles.headerTitle}>Modifier le live</Text>
          <View style={styles.iconBtn} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.field}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.inputHint}
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.label}>Date *</Text>
                <DateTimePicker
                  value={startsAt}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  locale="fr-FR"
                  // Tints the iOS pill so it doesn't look greyed-out/disabled.
                  // Force light mode so the popover calendar matches the form
                  // instead of iOS 26's dark Liquid Glass default, and the
                  // value text gets a high-contrast foreground (was failing
                  // WCAG AA on the time pill).
                  themeVariant="light"
                  onChange={onChangeDate}
                />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.label}>Heure *</Text>
                <DateTimePicker
                  value={startsAt}
                  mode="time"
                  display="default"
                  locale="fr-FR"
                  themeVariant="light"
                  onChange={onChangeTime}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={Colors.inputHint}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.goLivePressed,
                updateMutation.isPending && styles.saveBtnDisabled,
              ]}
              disabled={updateMutation.isPending}
              onPress={handleSave}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <Text style={styles.goLiveText}>Enregistrer</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
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
  section: {
    gap: Spacing.md,
  },
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
  empty: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  thumbFallback: { backgroundColor: Colors.muted },
  productName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    fontWeight: "500",
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
  pickerList: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
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
  field: { gap: Spacing.xs },
  fieldRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  fieldCol: { flex: 1, gap: Spacing.xs },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  input: {
    backgroundColor: Colors.input,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  errorText: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.sm,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
});

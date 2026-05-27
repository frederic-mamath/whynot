import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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

function dateToInputs(d: Date): { dateStr: string; timeStr: string } {
  const yyyy = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { dateStr: `${yyyy}-${mo}-${dd}`, timeStr: `${hh}:${mi}` };
}

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const [, y, mo, d] = dateMatch;
  const [, h, mi] = timeMatch;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
    0,
  );
  return isNaN(date.getTime()) ? null : date;
}

export default function SellerLiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const liveId = Number(id);
  const router = useRouter();
  const utils = trpc.useUtils();

  const liveQuery = trpc.live.get.useQuery({ channelId: liveId });
  const attachedQuery = trpc.product.listByChannel.useQuery({
    channelId: liveId,
  });
  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;
  const allProductsQuery = trpc.product.list.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: shopId !== undefined },
  );

  const associateMutation = trpc.product.associateToChannel.useMutation({
    onSuccess: () => {
      utils.product.listByChannel.invalidate({ channelId: liveId });
    },
  });
  const removeMutation = trpc.product.removeFromChannel.useMutation({
    onMutate: async ({ productId }) => {
      await utils.product.listByChannel.cancel({ channelId: liveId });
      const previous = utils.product.listByChannel.getData({
        channelId: liveId,
      });
      utils.product.listByChannel.setData({ channelId: liveId }, (old) =>
        old?.filter((p) => p.id !== productId),
      );
      return { previous };
    },
    onError: (_e, _i, ctx) => {
      if (ctx?.previous) {
        utils.product.listByChannel.setData(
          { channelId: liveId },
          ctx.previous,
        );
      }
    },
    onSettled: () =>
      utils.product.listByChannel.invalidate({ channelId: liveId }),
  });
  const deleteLiveMutation = trpc.live.delete.useMutation();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const live = liveQuery.data?.channel;
  const attached = attachedQuery.data ?? [];
  const attachedIds = new Set(attached.map((p) => p.id));
  const isUpcoming =
    !!live && new Date(live.starts_at).getTime() > Date.now();

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
          <Pressable
            onPress={() => setEditOpen(true)}
            style={styles.iconBtn}
          >
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
            <Text style={styles.empty}>
              Aucun produit attaché à ce live
            </Text>
          ) : (
            attached.map((p) => (
              <View key={p.id} style={styles.productRow}>
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.productThumb} />
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
            onPress={() => router.push(`/seller/live/${liveId}`)}
          >
            <Radio size={20} color={Colors.primaryForeground} />
            <Text style={styles.goLiveText}>Go Live</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.pressed,
          ]}
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
                    <View
                      style={[styles.productThumb, styles.thumbFallback]}
                    />
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
  const [name, setName] = useState(live.name);
  const [description, setDescription] = useState(live.description ?? "");
  const initial = dateToInputs(
    typeof live.starts_at === "string" ? new Date(live.starts_at) : live.starts_at,
  );
  const [dateStr, setDateStr] = useState(initial.dateStr);
  const [timeStr, setTimeStr] = useState(initial.timeStr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(live.name);
      setDescription(live.description ?? "");
      const init = dateToInputs(
        typeof live.starts_at === "string"
          ? new Date(live.starts_at)
          : live.starts_at,
      );
      setDateStr(init.dateStr);
      setTimeStr(init.timeStr);
      setError(null);
    }
  }, [visible, live]);

  const updateMutation = trpc.live.update.useMutation();

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setError("Le nom doit contenir au moins 3 caractères");
      return;
    }
    const startsAt = parseDateTime(dateStr, timeStr);
    if (!startsAt) {
      setError("Format de date attendu : AAAA-MM-JJ — heure HH:MM");
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
                <Text style={styles.label}>Date (AAAA-MM-JJ)</Text>
                <TextInput
                  style={styles.input}
                  value={dateStr}
                  onChangeText={setDateStr}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={Colors.inputHint}
                />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.label}>Heure (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={timeStr}
                  onChangeText={setTimeStr}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor={Colors.inputHint}
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

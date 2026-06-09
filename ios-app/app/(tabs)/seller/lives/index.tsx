import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2 } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

type Live = {
  id: number;
  name: string;
  starts_at: string | Date;
  cover_url: string | null;
};

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

export default function SellerLivesScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const livesQuery = trpc.live.listByHost.useQuery();
  const deleteMutation = trpc.live.delete.useMutation(
    useMutationWithToast({
      onMutate: async ({ liveId }) => {
        await utils.live.listByHost.cancel();
        const previous = utils.live.listByHost.getData();
        utils.live.listByHost.setData(undefined, (old) =>
          old
            ? {
                ...old,
                upcoming: old.upcoming.filter((l) => l.id !== liveId),
              }
            : old,
        );
        return { previous };
      },
      onError: (_err, _input, ctx) => {
        if (ctx?.previous) utils.live.listByHost.setData(undefined, ctx.previous);
      },
      onSettled: () => utils.live.listByHost.invalidate(),
    }),
  );

  const confirmDelete = (liveId: number, name: string) => {
    Alert.alert(
      "Supprimer ce live",
      `"${name}" sera supprimé définitivement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ liveId }),
        },
      ],
    );
  };

  const upcoming = (livesQuery.data?.upcoming ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    );
  const past = (livesQuery.data?.past ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Lives</Text>
      </View>

      {livesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Aucun live — planifiez votre premier live
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {upcoming.length > 0 && (
            <Section title="À venir">
              {upcoming.map((live) => (
                <LiveRow
                  key={live.id}
                  live={live}
                  canDelete
                  onDelete={() => confirmDelete(live.id, live.name)}
                  onPress={() => router.push(`/seller/lives/${live.id}`)}
                />
              ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="Passés">
              {past.map((live) => (
                <LiveRow
                  key={live.id}
                  live={live}
                  canDelete={false}
                  onPress={() => router.push(`/seller/lives/${live.id}`)}
                />
              ))}
            </Section>
          )}
        </ScrollView>
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push("/seller/lives/new")}
      >
        <Plus size={24} color={Colors.primaryForeground} />
      </Pressable>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>{children}</View>
    </View>
  );
}

function LiveRow({
  live,
  canDelete,
  onDelete,
  onPress,
}: {
  live: Live;
  canDelete: boolean;
  onDelete?: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      {live.cover_url ? (
        <Image source={{ uri: live.cover_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {live.name}
        </Text>
        <Text style={styles.date}>{formatStartsAt(live.starts_at)}</Text>
      </View>
      {canDelete && onDelete && (
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
          onPress={onDelete}
          hitSlop={8}
        >
          <Trash2 size={18} color={Colors.destructive} />
        </Pressable>
      )}
    </Pressable>
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
  back: { padding: Spacing.xs },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionList: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  thumbFallback: {
    backgroundColor: Colors.muted,
  },
  rowInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  pressed: { opacity: 0.6 },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabPressed: { opacity: 0.85 },
});

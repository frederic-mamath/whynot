import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

type PackageStatus =
  | "pending"
  | "label_generated"
  | "shipped"
  | "delivered"
  | "incident";

const STATUS_LABELS: Record<PackageStatus, string> = {
  pending: "En attente",
  label_generated: "Étiquette créée",
  shipped: "Expédié",
  delivered: "Livré",
  incident: "Incident",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function SellerDeliveriesScreen() {
  const router = useRouter();
  const packagesQuery = trpc.package.getPackagesForSeller.useQuery();

  const pending = packagesQuery.data?.pending ?? [];
  const shipped = packagesQuery.data?.shipped ?? [];
  const isEmpty = pending.length === 0 && shipped.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Livraisons</Text>
      </View>

      {packagesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Aucun colis pour le moment
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {pending.length > 0 && (
            <Section title="À expédier">
              {pending.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  onPress={() => router.push(`/seller/deliveries/${pkg.id}`)}
                />
              ))}
            </Section>
          )}
          {shipped.length > 0 && (
            <Section title="Expédiés">
              {shipped.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  onPress={() => router.push(`/seller/deliveries/${pkg.id}`)}
                />
              ))}
            </Section>
          )}
        </ScrollView>
      )}
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

function PackageRow({
  pkg,
  onPress,
}: {
  pkg: {
    id: string;
    status: PackageStatus;
    buyerName: string;
    createdAt: string;
    orders: Array<{ id: string }>;
  };
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.buyerName} numberOfLines={1}>
          {pkg.buyerName}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>
            {pkg.orders.length} article{pkg.orders.length > 1 ? "s" : ""}
          </Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>{formatDate(pkg.createdAt)}</Text>
        </View>
      </View>
      <StatusChip status={pkg.status} />
      <ChevronRight size={18} color={Colors.mutedForeground} />
    </Pressable>
  );
}

function StatusChip({ status }: { status: PackageStatus }) {
  return (
    <View style={[styles.chip, chipStyles[status]]}>
      <Text style={[styles.chipText, chipTextStyles[status]]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const chipStyles: Record<PackageStatus, { backgroundColor: string }> = {
  pending: { backgroundColor: Colors.muted },
  label_generated: { backgroundColor: Colors.accent },
  shipped: { backgroundColor: Colors.info },
  delivered: { backgroundColor: Colors.success },
  incident: { backgroundColor: Colors.destructive },
};

const chipTextStyles: Record<PackageStatus, { color: string }> = {
  pending: { color: Colors.mutedForeground },
  label_generated: { color: Colors.accentForeground },
  shipped: { color: Colors.infoForeground },
  delivered: { color: Colors.successForeground },
  incident: { color: Colors.destructiveForeground },
};

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
  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionList: { gap: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowPressed: { opacity: 0.7 },
  rowInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  buyerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  metaDot: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  chipText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
  },
});

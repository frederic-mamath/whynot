import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { TrendingUp, Users, Sparkles } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

export default function VendreScreen() {
  const rolesQuery = trpc.role.myRoles.useQuery();

  if (rolesQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const isSeller = rolesQuery.data?.roles.includes("SELLER") ?? false;

  if (isSeller) {
    return <SellerDashboardStub />;
  }

  return <SellerUpsell />;
}

function SellerDashboardStub() {
  return (
    <View style={styles.center}>
      <Text style={styles.dashboardTitle}>Mon espace vendeur</Text>
    </View>
  );
}

function SellerUpsell() {
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  const requestMutation = trpc.role.requestSellerRole.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => {
      if (err.data?.code === "BAD_REQUEST") {
        setAlreadyRequested(true);
      }
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendez sur Popup</Text>
        <Text style={styles.subtitle}>
          Lancez votre boutique et organisez des lives pour vendre vos articles
          en quelques minutes
        </Text>
      </View>

      <View style={styles.benefits}>
        <BenefitRow
          icon={<TrendingUp size={24} color={Colors.primary} />}
          title="Revenus immédiats"
          description="Encaissez les ventes en temps réel via Stripe"
        />
        <BenefitRow
          icon={<Users size={24} color={Colors.primary} />}
          title="Audience engagée"
          description="Touchez des acheteurs prêts à acheter pendant vos lives"
        />
        <BenefitRow
          icon={<Sparkles size={24} color={Colors.primary} />}
          title="Mise en route simple"
          description="Ajoutez vos produits, planifiez un live, vendez"
        />
      </View>

      {submitted ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            Demande envoyée — vous serez contacté pour activer votre compte
            vendeur
          </Text>
        </View>
      ) : alreadyRequested ? (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingText}>
            Votre demande est déjà en cours d'examen
          </Text>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            requestMutation.isPending && styles.ctaDisabled,
          ]}
          disabled={requestMutation.isPending}
          onPress={() => requestMutation.mutate()}
        >
          {requestMutation.isPending ? (
            <ActivityIndicator color={Colors.primaryForeground} />
          ) : (
            <Text style={styles.ctaText}>Devenir vendeur</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

function BenefitRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>{icon}</View>
      <View style={styles.benefitContent}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  dashboardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing["3xl"],
    backgroundColor: Colors.background,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "700",
    color: Colors.foreground,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.mutedForeground,
    lineHeight: 22,
  },
  benefits: {
    gap: Spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  benefitTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  benefitDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
  successBox: {
    backgroundColor: Colors.accent,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  successText: {
    color: Colors.accentForeground,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
  pendingBox: {
    backgroundColor: Colors.muted,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  pendingText: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },
});

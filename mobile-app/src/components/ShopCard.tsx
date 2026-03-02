import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Store, ChevronRight } from "lucide-react-native";

interface ShopCardProps {
  id: number;
  name: string;
  description?: string | null;
  role: string;
  onPress: (id: number) => void;
}

export function ShopCard({
  id,
  name,
  description,
  role,
  onPress,
}: ShopCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(id)}
    >
      <View style={styles.iconContainer}>
        <Store size={24} color={styles.icon.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>

      <ChevronRight size={20} color={styles.chevron.color} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cardPressed: {
    opacity: 0.85,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.mutedForeground,
    textTransform: "capitalize",
  },
  chevron: {
    color: theme.colors.mutedForeground,
  },
}));

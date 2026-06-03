import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import { Colors } from "@/theme/tokens";

export type LiveCardData = {
  id: number;
  name: string;
  coverUrl: string | null;
  hostNickname: string;
  participantCount: number | null;
  isActive: boolean;
};

export function LiveCard({ live }: { live: LiveCardData }) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/live/${live.id}`)}
    >
      <View style={styles.imageContainer}>
        {live.coverUrl ? (
          <Image source={{ uri: live.coverUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {live.isActive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
        {live.participantCount !== null && live.participantCount > 0 && (
          <View style={styles.viewerBadge}>
            <Users size={10} color={Colors.foreground} />
            <Text style={styles.viewerText}>{live.participantCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {live.name}
        </Text>
        <Text style={styles.host} numberOfLines={1}>
          @{live.hostNickname}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.card,
  },
  imageContainer: {
    aspectRatio: 9 / 16,
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.muted,
  },
  liveBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.destructive,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveBadgeText: {
    color: Colors.destructiveForeground,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  viewerBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewerText: {
    color: Colors.foreground,
    fontSize: 11,
    fontWeight: "600",
  },
  info: {
    padding: 8,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.foreground,
    lineHeight: 18,
  },
  host: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
});

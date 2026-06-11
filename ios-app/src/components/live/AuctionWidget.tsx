import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";
import { AuctionCountdown } from "./AuctionCountdown";
import { BidRequirementsSheet } from "./BidRequirementsSheet";

type Props = {
  channelId: number;
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
};

export function AuctionWidget({ channelId, forceOpen, onForceOpenHandled }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setSheetOpen(true);
      onForceOpenHandled?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: L3 follow-up (onForceOpenHandled missing from deps)
  }, [forceOpen]);

  const { data: auction } = trpc.auction.getActive.useQuery(
    { channelId },
    { refetchInterval: 3000 }
  );

  if (!auction) return null;

  const nextBid = auction.currentBid + 1;

  return (
    <>
      <View style={styles.widget}>
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={1}>
            {auction.productName}
          </Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.bidLabel}>Enchère actuelle</Text>
              <Text style={styles.bidAmount}>{auction.currentBid.toFixed(2)} €</Text>
            </View>
            <AuctionCountdown endsAt={auction.endsAt} />
          </View>
          {auction.highestBidderUsername && (
            <Text style={styles.bidder}>par {auction.highestBidderUsername}</Text>
          )}
        </View>
        <Pressable style={styles.bidButton} onPress={() => setSheetOpen(true)}>
          <Text style={styles.bidButtonText}>Enchérir</Text>
          <Text style={styles.bidButtonSub}>{nextBid.toFixed(2)} €</Text>
        </Pressable>
      </View>

      <BidRequirementsSheet
        visible={sheetOpen}
        auctionId={auction.id}
        channelId={channelId}
        bidAmount={nextBid}
        onClose={() => setSheetOpen(false)}
        onBidPlaced={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  widget: {
    position: "absolute",
    bottom: 270,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(224,255,0,0.3)",
  },
  info: { flex: 1, gap: 4 },
  productName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
    color: Colors.foreground,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bidLabel: { fontSize: Typography.fontSize.xs, color: "rgba(255,255,255,0.6)" },
  bidAmount: { fontSize: Typography.fontSize.lg, fontWeight: "700", color: Colors.foreground },
  bidder: { fontSize: Typography.fontSize.xs, color: "rgba(255,255,255,0.5)" },
  bidButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    minWidth: 80,
  },
  bidButtonText: { color: Colors.primaryForeground, fontSize: Typography.fontSize.xs, fontWeight: "700" },
  bidButtonSub: { color: Colors.primaryForeground, fontSize: Typography.fontSize.xs, marginTop: 1 },
});

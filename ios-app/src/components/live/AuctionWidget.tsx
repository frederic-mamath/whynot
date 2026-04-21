import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { trpc } from "@/lib/trpc";
import { AuctionCountdown } from "./AuctionCountdown";
import { BidRequirementsSheet } from "./BidRequirementsSheet";

type Props = { channelId: number };

export function AuctionWidget({ channelId }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

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
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.5)",
  },
  info: { flex: 1, gap: 4 },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bidLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  bidAmount: { fontSize: 18, fontWeight: "700", color: "#fff" },
  bidder: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  bidButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 80,
  },
  bidButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  bidButtonSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 1 },
});

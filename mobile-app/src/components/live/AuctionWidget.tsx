import { View, Text, Image, Pressable, Alert } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Gavel, ShoppingCart } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { AuctionCountdown } from "./AuctionCountdown";
import { BidInput } from "./BidInput";

interface AuctionData {
  id: string;
  productName: string;
  productImageUrl: string | null;
  currentBid: number;
  highestBidderId: number | null;
  highestBidderUsername: string | null;
  buyoutPrice: number | null;
  endsAt: string;
  status: string;
}

interface AuctionWidgetProps {
  auction: AuctionData;
  onAuctionEnd?: () => void;
}

export function AuctionWidget({ auction, onAuctionEnd }: AuctionWidgetProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const placeBidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: () => {
      utils.auction.getActive.invalidate();
      utils.auction.getBidHistory.invalidate();
    },
    onError: (error) => {
      Alert.alert("Bid Failed", error.message);
    },
  });

  const buyoutMutation = trpc.auction.buyout.useMutation({
    onSuccess: (data) => {
      Alert.alert(
        "Purchased!",
        `You bought it for €${data.finalPrice.toFixed(2)}`,
      );
      utils.auction.getActive.invalidate();
    },
    onError: (error) => {
      Alert.alert("Buyout Failed", error.message);
    },
  });

  const handlePlaceBid = (amount: number) => {
    placeBidMutation.mutate({ auctionId: auction.id, amount });
  };

  const handleBuyout = () => {
    if (!auction.buyoutPrice) return;
    Alert.alert(
      "Buy Now",
      `Buy "${auction.productName}" for €${auction.buyoutPrice.toFixed(2)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: () => buyoutMutation.mutate({ auctionId: auction.id }),
        },
      ],
    );
  };

  const isEnded = auction.status !== "active";
  const isHighestBidder = user?.id === auction.highestBidderId;

  return (
    <View style={styles.container}>
      {/* Product info + timer */}
      <View style={styles.header}>
        <View style={styles.productInfo}>
          {auction.productImageUrl ? (
            <Image
              source={{ uri: auction.productImageUrl }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Gavel size={18} color="#fff" />
            </View>
          )}
          <View style={styles.productText}>
            <Text style={styles.productName} numberOfLines={1}>
              {auction.productName}
            </Text>
            <Text style={styles.currentBid}>
              €{auction.currentBid.toFixed(2)}
            </Text>
            {auction.highestBidderUsername && (
              <Text style={styles.bidder}>
                {isHighestBidder
                  ? "You're winning!"
                  : auction.highestBidderUsername}
              </Text>
            )}
          </View>
        </View>
        {!isEnded && (
          <AuctionCountdown endsAt={auction.endsAt} onExpired={onAuctionEnd} />
        )}
      </View>

      {/* Bid + Buyout actions */}
      {!isEnded && (
        <View style={styles.actions}>
          <BidInput
            currentBid={auction.currentBid}
            isPending={placeBidMutation.isPending}
            onPlaceBid={handlePlaceBid}
          />
          {auction.buyoutPrice && (
            <Pressable
              style={({ pressed }) => [
                styles.buyoutButton,
                pressed && styles.buyoutPressed,
              ]}
              onPress={handleBuyout}
              disabled={buyoutMutation.isPending}
            >
              <ShoppingCart size={16} color="#fff" />
              <Text style={styles.buyoutText}>
                Buy €{auction.buyoutPrice.toFixed(2)}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  productInfo: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  productText: {
    flex: 1,
    gap: 2,
  },
  productName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "500",
  },
  currentBid: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  bidder: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
  },
  actions: {
    gap: 8,
  },
  buyoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(59, 130, 246, 0.85)",
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyoutPressed: {
    opacity: 0.8,
  },
  buyoutText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
}));

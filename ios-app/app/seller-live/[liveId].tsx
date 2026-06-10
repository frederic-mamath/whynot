/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-010 (cache strategy sweep) */
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Square, Tag, X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAgoraBroadcaster } from "@/hooks/useAgoraSession";
import { useAuth } from "@/contexts/AuthContext";
import { isAgoraAvailable, RtcLocalView } from "@/lib/agora";
import { ChatPanel } from "@/components/live/ChatPanel";
import { AuctionCountdown } from "@/components/live/AuctionCountdown";
import { AuctionSheet } from "@/components/seller-live/AuctionSheet";
import { BroadcasterBottomBar } from "@/components/seller-live/BroadcasterBottomBar";
import { BroadcasterTopBar } from "@/components/seller-live/BroadcasterTopBar";
import { HighlightSheet } from "@/components/seller-live/HighlightSheet";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";

export default function SellerGoLiveScreen() {
  const { liveId } = useLocalSearchParams<{ liveId: string }>();
  const channelId = Number(liveId);
  const router = useRouter();
  const { user: _user } = useAuth();

  const { hasInitialized, isBroadcasting, startBroadcast, stopBroadcast } =
    useAgoraBroadcaster({
      channelId,
      onInitializationFailed: () => router.back(),
    });

  const [sheet, setSheet] = useState<"highlight" | "auction" | null>(null);

  const endMutation = trpc.live.end.useMutation(useMutationWithToast());
  const highlightMutation = trpc.live.highlightProduct.useMutation(
    useMutationWithToast(),
  );
  const unhighlightMutation = trpc.live.unhighlightProduct.useMutation(
    useMutationWithToast(),
  );
  const closeAuctionMutation = trpc.auction.close.useMutation(
    useMutationWithToast(),
  );

  const productsQuery = trpc.product.listByChannel.useQuery({ channelId });
  const activeAuctionQuery = trpc.auction.getActive.useQuery(
    { channelId },
    { refetchInterval: isBroadcasting ? 2000 : false },
  );
  const liveGetQuery = trpc.live.get.useQuery({ channelId });

  const utils = trpc.useUtils();

  const [highlightedProductId, setHighlightedProductId] = useState<
    number | null
  >(liveGetQuery.data?.channel?.highlighted_product_id ?? null);

  useEffect(() => {
    if (liveGetQuery.data?.channel) {
      setHighlightedProductId(
        liveGetQuery.data.channel.highlighted_product_id ?? null,
      );
    }
  }, [liveGetQuery.data?.channel]);

  trpc.live.subscribeToEvents.useSubscription(
    { channelId },
    {
      enabled: isBroadcasting,
      onData: (event) => {
        switch (event.type) {
          case "PRODUCT_HIGHLIGHTED":
            setHighlightedProductId(event.product.id);
            return;
          case "PRODUCT_UNHIGHLIGHTED":
            setHighlightedProductId(null);
            return;
          case "auction:ended":
            utils.auction.getActive.invalidate({ channelId });
            return;
          default: {
            const _exhaustive: never = event;
            return _exhaustive;
          }
        }
      },
    },
  );

  const handleEndLive = () => {
    Alert.alert(
      "Terminer le live",
      "La diffusion sera arrêtée et le live marqué comme terminé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Terminer",
          style: "destructive",
          onPress: async () => {
            // endMutation is wrapped with useMutationWithToast — the banner
            // surfaces server-side errors. A reject just means the server
            // already ended the live, so we still stop broadcasting and exit.
            await endMutation.mutateAsync({ channelId }).catch(() => null);
            await stopBroadcast();
            router.back();
          },
        },
      ],
    );
  };

  const handleLeave = async () => {
    await stopBroadcast();
    router.back();
  };

  const handleHighlightProduct = async (productId: number) => {
    setSheet(null);
    setHighlightedProductId(productId);
    try {
      await highlightMutation.mutateAsync({ channelId, productId });
    } catch {
      // Roll back the optimistic state; useMutationWithToast already showed the banner.
      setHighlightedProductId(null);
    }
  };

  const handleUnhighlight = async () => {
    setHighlightedProductId(null);
    await unhighlightMutation.mutateAsync({ channelId }).catch(() => null);
  };

  const handleCloseAuction = async () => {
    const auction = activeAuctionQuery.data;
    if (!auction) return;
    try {
      await closeAuctionMutation.mutateAsync({ auctionId: auction.id });
      utils.auction.getActive.invalidate({ channelId });
    } catch {
      // useMutationWithToast already surfaced the error.
    }
  };

  const products = productsQuery.data ?? [];
  const highlightedProduct = products.find(
    (p) => p.id === highlightedProductId,
  );
  const activeAuction = activeAuctionQuery.data;

  return (
    <View style={styles.container}>
      {isAgoraAvailable && RtcLocalView && hasInitialized && (
        <RtcLocalView style={StyleSheet.absoluteFill} />
      )}
      {!isAgoraAvailable && (
        <View style={styles.cameraFallback}>
          <Text style={styles.cameraFallbackText}>
            Caméra indisponible sur cet appareil
          </Text>
        </View>
      )}

      <BroadcasterTopBar
        isBroadcasting={isBroadcasting}
        onClose={isBroadcasting ? handleLeave : () => router.back()}
      />

      {highlightedProduct && (
        <View style={styles.highlightedBanner}>
          <Tag size={14} color={Colors.foreground} />
          <Text style={styles.highlightedName} numberOfLines={1}>
            {highlightedProduct.name}
          </Text>
          <Pressable onPress={handleUnhighlight} hitSlop={8}>
            <X size={16} color={Colors.foreground} />
          </Pressable>
        </View>
      )}

      {activeAuction && (
        <View style={styles.auctionPanel}>
          <View style={styles.auctionRow}>
            <Text style={styles.auctionLabel}>Enchère en cours</Text>
            <AuctionCountdown endsAt={activeAuction.endsAt} />
          </View>
          <Text style={styles.auctionBid}>
            {activeAuction.currentBid.toFixed(2)} €
            {activeAuction.highestBidderUsername
              ? `  ·  ${activeAuction.highestBidderUsername}`
              : ""}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.endAuctionBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleCloseAuction}
          >
            <Square size={14} color={Colors.destructiveForeground} />
            <Text style={styles.endAuctionText}>Terminer l&apos;enchère</Text>
          </Pressable>
        </View>
      )}

      {isBroadcasting && (
        <View style={styles.chatWrap}>
          <ChatPanel channelId={channelId} />
        </View>
      )}

      <BroadcasterBottomBar
        isBroadcasting={isBroadcasting}
        hasInitialized={hasInitialized}
        hasHighlightedProduct={highlightedProduct !== undefined}
        hasActiveAuction={activeAuction !== undefined}
        onStartLive={startBroadcast}
        onOpenHighlight={() => setSheet("highlight")}
        onOpenAuction={() => setSheet("auction")}
        onEndLive={handleEndLive}
      />

      <HighlightSheet
        visible={sheet === "highlight"}
        onClose={() => setSheet(null)}
        products={products}
        highlightedId={highlightedProductId}
        onSelect={handleHighlightProduct}
      />

      <AuctionSheet
        channelId={channelId}
        visible={sheet === "auction"}
        onClose={() => setSheet(null)}
        product={highlightedProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  cameraFallbackText: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
  },
  highlightedBanner: {
    position: "absolute",
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    zIndex: 5,
  },
  highlightedName: {
    flex: 1,
    color: Colors.foreground,
    fontWeight: "600",
    fontSize: Typography.fontSize.sm,
  },
  auctionPanel: {
    position: "absolute",
    top: 165,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    zIndex: 5,
  },
  auctionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auctionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  auctionBid: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
  },
  endAuctionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.destructive,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  endAuctionText: {
    color: Colors.destructiveForeground,
    fontWeight: "600",
    fontSize: Typography.fontSize.sm,
  },
  chatWrap: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    height: 280,
  },
  pressed: { opacity: 0.7 },
});

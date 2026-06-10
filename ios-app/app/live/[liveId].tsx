/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-010 (cache strategy sweep) */
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { isAgoraAvailable, RtcSurfaceView } from "@/lib/agora";
import { trpc } from "@/lib/trpc";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAgoraAudience } from "@/hooks/useAgoraSession";
import { LiveBadge } from "@/components/live/LiveBadge";
import { ChatPanel } from "@/components/live/ChatPanel";
import { HighlightedProduct } from "@/components/live/HighlightedProduct";
import { AuctionWidget } from "@/components/live/AuctionWidget";
import { AuctionEndModal } from "@/components/live/AuctionEndModal";
import { LiveProductList } from "@/components/live/LiveProductList";
import { Colors, Radius, Spacing, Typography } from "@/theme/tokens";
import { useTrack } from "@/lib/analytics";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type HighlightedProductData = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type AuctionEndInfo = {
  isWinner: boolean;
  productName: string;
  finalPrice: number;
  winnerUsername: string | null;
};

export default function LiveScreen() {
  const { liveId } = useLocalSearchParams<{ liveId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const channelId = Number(liveId);

  const [highlightedProduct, setHighlightedProduct] = useState<HighlightedProductData | null>(null);
  const [auctionEndInfo, setAuctionEndInfo] = useState<AuctionEndInfo | null>(null);
  const [openBidSheet, setOpenBidSheet] = useState(false);
  const track = useTrack();
  const liveViewedRef = useRef(false);

  const liveQuery = trpc.live.get.useQuery({ channelId });
  const isViewerHost =
    user != null && liveQuery.data?.channel.host_id === user.id;
  const canJoin = liveQuery.data != null && !isViewerHost;

  const { liveStatus, joined, remoteUid } = useAgoraAudience({
    channelId,
    enabled: canJoin,
  });

  const productsQuery = trpc.product.listByChannel.useQuery(
    { channelId },
    { enabled: liveStatus === "active" },
  );
  const utils = trpc.useUtils();
  const toggleInterestMutation = trpc.product.toggleInterest.useMutation(
    useMutationWithToast({
      onSuccess: () => {
        utils.product.listByChannel.invalidate({ channelId });
      },
    }),
  );

  trpc.live.subscribeToEvents.useSubscription(
    { channelId },
    {
      enabled: liveStatus === "active",
      onData: (event) => {
        switch (event.type) {
          case "PRODUCT_HIGHLIGHTED":
            setHighlightedProduct({
              id: event.product.id,
              name: event.product.name,
              price: event.product.price,
              imageUrl: event.product.imageUrl,
            });
            return;
          case "PRODUCT_UNHIGHLIGHTED":
            setHighlightedProduct(null);
            return;
          case "auction:ended": {
            const isWinner =
              event.winnerId !== null && user?.id === event.winnerId;
            setAuctionEndInfo({
              isWinner,
              productName: highlightedProduct?.name ?? "Produit",
              finalPrice: event.finalPrice,
              winnerUsername: event.winnerUsername,
            });
            if (isWinner) {
              track({
                name: "auction_won",
                auctionId: event.auctionId,
                liveId: channelId,
                finalPrice: event.finalPrice,
              });
            }
            return;
          }
          default: {
            const _exhaustive: never = event;
            return _exhaustive;
          }
        }
      },
    }
  );

  // Hosts open the broadcaster screen instead — redirect once liveQuery resolves.
  useEffect(() => {
    if (isViewerHost) {
      router.replace(`/seller-live/${channelId}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: L3 follow-up (router missing from deps)
  }, [isViewerHost, channelId]);

  // Fire live_viewed once, when the audience hook reports the live is active.
  useEffect(() => {
    if (liveStatus !== "active") return;
    if (liveViewedRef.current) return;
    const hostId = liveQuery.data?.channel.host_id;
    if (hostId == null) return;
    liveViewedRef.current = true;
    track({
      name: "live_viewed",
      liveId: channelId,
      hostId,
      isSellerView: false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: L3 follow-up (track ref stability)
  }, [liveStatus, liveQuery.data, channelId]);

  const handleBack = () => {
    router.back();
  };

  if (isViewerHost) {
    return null;
  }

  const products = productsQuery.data ?? [];
  const hasProducts = products.length > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        pagingEnabled
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* Page 1 — video + overlays */}
        <View style={{ height: SCREEN_HEIGHT, overflow: "hidden" }}>
          {/* Video layer */}
          {joined && remoteUid !== null && RtcSurfaceView && (
            <RtcSurfaceView
              style={StyleSheet.absoluteFill}
              canvas={{ uid: remoteUid }}
            />
          )}

          {/* Video unavailable placeholder */}
          {liveStatus === "active" && !isAgoraAvailable && (
            <View style={styles.noVideoOverlay}>
              <Text style={styles.noVideoText}>Vidéo non disponible sur cet appareil</Text>
            </View>
          )}

          {/* Top bar: back + LIVE badge */}
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backText}>✕</Text>
            </Pressable>
            {liveStatus === "active" && (
              <LiveBadge channelId={channelId} />
            )}
          </View>

          {/* Highlighted product overlay */}
          {liveStatus === "active" && (
            <HighlightedProduct product={highlightedProduct} />
          )}

          {/* Center states */}
          {liveStatus === "loading" && (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.foreground} size="large" />
            </View>
          )}

          {liveStatus === "active" && joined && remoteUid === null && isAgoraAvailable && (
            <View style={styles.center}>
              <Text style={styles.waitText}>En attente du vendeur…</Text>
            </View>
          )}

          {liveStatus === "upcoming" && (
            <View style={styles.center}>
              <Text style={styles.statusEmoji}>🕐</Text>
              <Text style={styles.statusTitle}>Live pas encore commencé</Text>
              <Text style={styles.statusSub}>Revenez bientôt</Text>
            </View>
          )}

          {liveStatus === "ended" && (
            <View style={styles.center}>
              <Text style={styles.statusEmoji}>🎬</Text>
              <Text style={styles.statusTitle}>Ce live est terminé</Text>
            </View>
          )}

          {/* Auction widget + end modal — only when active */}
          {liveStatus === "active" && (
            <AuctionWidget
              channelId={channelId}
              forceOpen={openBidSheet}
              onForceOpenHandled={() => setOpenBidSheet(false)}
            />
          )}

          {/* Chat panel — only when active */}
          {liveStatus === "active" && <ChatPanel channelId={channelId} />}

          {/* Swipe-down cue */}
          {liveStatus === "active" && hasProducts && (
            <View style={styles.swipeCue} pointerEvents="none">
              <Text style={styles.swipeCueText}>⌄ Produits du live</Text>
            </View>
          )}
        </View>

        {/* Page 2 — product lineup */}
        <View style={{ height: SCREEN_HEIGHT, backgroundColor: Colors.background }}>
          <LiveProductList
            products={products}
            isLoading={productsQuery.isLoading}
            isSellerView={false}
            onToggleInterest={(productId, { onError }) =>
              toggleInterestMutation.mutate(
                { productId, liveId: channelId },
                { onError },
              )
            }
          />
        </View>
      </ScrollView>

      {auctionEndInfo && (
        <AuctionEndModal
          visible={!!auctionEndInfo}
          isWinner={auctionEndInfo.isWinner}
          productName={auctionEndInfo.productName}
          finalPrice={auctionEndInfo.finalPrice}
          winnerUsername={auctionEndInfo.winnerUsername}
          onClose={() => setAuctionEndInfo(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius["2xl"],
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  waitText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: Typography.fontSize.base,
  },
  statusEmoji: {
    fontSize: Typography.fontSize["3xl"],
  },
  statusTitle: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  statusSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: Typography.fontSize.sm,
  },
  noVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  noVideoText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  swipeCue: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  swipeCueText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

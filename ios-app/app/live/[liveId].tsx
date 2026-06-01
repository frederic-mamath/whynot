import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  isAgoraAvailable,
  createAgoraRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
  ClientRoleType,
} from "@/lib/agora";
import { trpc } from "@/lib/trpc";
import { LiveBadge } from "@/components/live/LiveBadge";
import { ChatPanel } from "@/components/live/ChatPanel";
import { HighlightedProduct } from "@/components/live/HighlightedProduct";
import { AuctionWidget } from "@/components/live/AuctionWidget";
import { AuctionEndModal } from "@/components/live/AuctionEndModal";
import { OutbidBanner } from "@/components/live/OutbidBanner";
import { LiveProductList } from "@/components/live/LiveProductList";
import { Colors } from "@/theme/tokens";
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

  const engineRef = useRef<ReturnType<typeof createAgoraRtcEngine> | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"loading" | "upcoming" | "active" | "ended">("loading");
  const [highlightedProduct, setHighlightedProduct] = useState<HighlightedProductData | null>(null);
  const [auctionEndInfo, setAuctionEndInfo] = useState<AuctionEndInfo | null>(null);
  const [outbidBanner, setOutbidBanner] = useState<{ productName: string; newBid: number } | null>(null);
  const [openBidSheet, setOpenBidSheet] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const track = useTrack();
  const liveViewedRef = useRef(false);

  const productsQuery = trpc.product.listByChannel.useQuery(
    { channelId },
    { enabled: liveStatus === "active" },
  );
  const utils = trpc.useUtils();
  const toggleInterestMutation = trpc.product.toggleInterest.useMutation({
    onSuccess: () => {
      utils.product.listByChannel.invalidate({ channelId });
    },
  });

  const joinMutation = trpc.live.join.useMutation();
  const leaveMutation = trpc.live.leave.useMutation();

  trpc.live.subscribeToEvents.useSubscription(
    { channelId },
    {
      enabled: liveStatus === "active",
      onData: (event) => {
        const e = event as {
          type: string;
          product?: HighlightedProductData;
          winnerUsername?: string | null;
          winnerId?: number | null;
          finalPrice?: number;
          hasWinner?: boolean;
          auctionId?: string;
          outbidUserId?: number;
          productName?: string;
          currentBid?: number;
        };
        if (e.type === "PRODUCT_HIGHLIGHTED" && e.product) {
          setHighlightedProduct(e.product);
        } else if (e.type === "PRODUCT_UNHIGHLIGHTED") {
          setHighlightedProduct(null);
        } else if (e.type === "auction:ended") {
          setAuctionEndInfo({
            isWinner: !!(e.winnerId && user?.id === e.winnerId),
            productName: highlightedProduct?.name ?? "Produit",
            finalPrice: e.finalPrice ?? 0,
            winnerUsername: e.winnerUsername ?? null,
          });
          if (e.winnerId && user?.id === e.winnerId && e.auctionId) {
            track({
              name: "auction_won",
              auctionId: e.auctionId,
              liveId: channelId,
              finalPrice: e.finalPrice ?? 0,
            });
          }
        } else if (e.type === "auction:outbid" && e.outbidUserId === user?.id) {
          setOutbidBanner({
            productName: e.productName ?? "",
            newBid: e.currentBid ?? 0,
          });
        }
      },
    }
  );

  const cleanup = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.removeAllListeners();
    await engine.leaveChannel();
    engine.release();
    engineRef.current = null;
    leaveMutation.mutate({ channelId });
  };

  useEffect(() => {
    joinMutation.mutate(
      { channelId },
      {
        onSuccess: async (data) => {
          if (data.liveStatus !== "active") {
            setLiveStatus(data.liveStatus as "upcoming" | "ended");
            return;
          }

          setLiveStatus("active");

          const channelData = data as { liveStatus: "active"; channel?: { host_id?: number } };
          const hostId = channelData.channel?.host_id;
          const isViewerHost = hostId != null && hostId === user?.id;
          if (hostId != null) {
            setIsHost(isViewerHost);
          }

          if (!liveViewedRef.current && hostId != null) {
            liveViewedRef.current = true;
            track({
              name: "live_viewed",
              liveId: channelId,
              hostId,
              isSellerView: isViewerHost,
            });
          }

          if (!isAgoraAvailable || !createAgoraRtcEngine) return;

          const { token, appId, uid, channel } = data as {
            liveStatus: "active";
            token: string;
            appId: string;
            uid: number;
            channel: { id: number };
          };

          const engine = createAgoraRtcEngine();
          engineRef.current = engine;

          engine.initialize({
            appId,
            channelProfile: ChannelProfileType!.ChannelProfileLiveBroadcasting,
          });

          engine.setClientRole(ClientRoleType!.ClientRoleAudience);
          engine.enableVideo();

          engine.addListener("onUserJoined", (_: any, uid: number) => {
            setRemoteUid(uid);
          });

          engine.addListener("onUserOffline", () => {
            setRemoteUid(null);
          });

          await engine.joinChannel(token, channel.id.toString(), uid, {
            autoSubscribeVideo: true,
            autoSubscribeAudio: true,
          });

          setJoined(true);
        },
        onError: () => {
          setLiveStatus("ended");
        },
      }
    );

    return () => {
      cleanup();
    };
  }, [channelId]);

  const handleBack = async () => {
    await cleanup();
    router.back();
  };

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
              <ActivityIndicator color="#fff" size="large" />
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

          {/* Outbid banner — overlays the top of the screen */}
          {outbidBanner && (
            <OutbidBanner
              productName={outbidBanner.productName}
              newBid={outbidBanner.newBid}
              onDismiss={() => setOutbidBanner(null)}
              onBidAgain={() => setOpenBidSheet(true)}
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
            isSellerView={isHost}
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
    backgroundColor: "#000",
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
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
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
    fontSize: 16,
  },
  statusEmoji: {
    fontSize: 40,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  statusSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  noVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  noVideoText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
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
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

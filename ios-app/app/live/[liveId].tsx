import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  RtcConnection,
  UserOfflineReasonType,
} from "react-native-agora";
import { trpc } from "@/lib/trpc";
import { LiveBadge } from "@/components/live/LiveBadge";
import { ChatPanel } from "@/components/live/ChatPanel";
import { HighlightedProduct } from "@/components/live/HighlightedProduct";
import { AuctionWidget } from "@/components/live/AuctionWidget";
import { AuctionEndModal } from "@/components/live/AuctionEndModal";

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

  const engineRef = useRef<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [joined, setJoined] = useState(false);
  const [liveStatus, setLiveStatus] = useState<"loading" | "upcoming" | "active" | "ended">("loading");
  const [highlightedProduct, setHighlightedProduct] = useState<HighlightedProductData | null>(null);
  const [auctionEndInfo, setAuctionEndInfo] = useState<AuctionEndInfo | null>(null);

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
            channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
          });

          engine.setClientRole(ClientRoleType.ClientRoleAudience);
          engine.enableVideo();

          engine.addListener("onUserJoined", (_connection: RtcConnection, uid: number) => {
            setRemoteUid(uid);
          });

          engine.addListener(
            "onUserOffline",
            (_connection: RtcConnection, _uid: number, _reason: UserOfflineReasonType) => {
              setRemoteUid(null);
            }
          );

          await engine.joinChannel(token, channel.id.toString(), uid, {
            autoSubscribeVideo: true,
            autoSubscribeAudio: true,
          });

          setJoined(true);
          setLiveStatus("active");
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

  return (
    <View style={styles.container}>
      {/* Video layer */}
      {joined && remoteUid !== null && (
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{ uid: remoteUid }}
        />
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

      {liveStatus === "active" && joined && remoteUid === null && (
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
      {liveStatus === "active" && <AuctionWidget channelId={channelId} />}

      {/* Chat panel — only when active */}
      {liveStatus === "active" && <ChatPanel channelId={channelId} />}

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
});

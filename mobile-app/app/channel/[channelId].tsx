import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";
import { ArrowLeft } from "lucide-react-native";
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  VideoSourceType,
} from "react-native-agora";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { usePayment } from "@/hooks/usePayment";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LiveBadge } from "@/components/live/LiveBadge";
import { ChatPanel } from "@/components/live/ChatPanel";
import { HighlightedProduct } from "@/components/live/HighlightedProduct";
import { AuctionWidget } from "@/components/live/AuctionWidget";
import { AuctionEndModal } from "@/components/live/AuctionEndModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface HighlightedProductData {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string | null;
}

export default function ChannelViewerScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const router = useRouter();
  const engineRef = useRef<IRtcEngine | null>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [highlightedProduct, setHighlightedProduct] =
    useState<HighlightedProductData | null>(null);
  const [auctionEndInfo, setAuctionEndInfo] = useState<{
    visible: boolean;
    isWinner: boolean;
    productName: string;
    finalPrice: number;
    winnerUsername: string | null;
    orderId: string | null;
  } | null>(null);

  const channelIdNum = Number(channelId);
  const { user } = useAuth();
  const { pay } = usePayment();

  // Get participant count
  const { data: participants } = trpc.channel.participants.useQuery(
    { channelId: channelIdNum },
    { enabled: !!channelId, refetchInterval: 10_000 },
  );

  // Get highlighted product
  const { data: highlightedData } = trpc.channel.getHighlightedProduct.useQuery(
    { channelId: channelIdNum },
    { enabled: !!channelId },
  );

  useEffect(() => {
    if (highlightedData?.product) {
      setHighlightedProduct({
        id: highlightedData.product.id,
        name: highlightedData.product.name,
        price: highlightedData.product.price,
        description: highlightedData.product.description || "",
        imageUrl: highlightedData.product.imageUrl,
      });
    } else {
      setHighlightedProduct(null);
    }
  }, [highlightedData]);

  // Subscribe to channel events (highlight/unhighlight)
  trpc.channel.subscribeToEvents.useSubscription(
    { channelId: channelIdNum },
    {
      enabled: !!channelId,
      onData: (event: any) => {
        if (event.type === "PRODUCT_HIGHLIGHTED") {
          setHighlightedProduct({
            id: event.product.id,
            name: event.product.name,
            price: event.product.price,
            description: event.product.description,
            imageUrl: event.product.imageUrl,
          });
        } else if (event.type === "PRODUCT_UNHIGHLIGHTED") {
          setHighlightedProduct(null);
        }
      },
    },
  );

  // Join channel mutation
  const joinMutation = trpc.channel.join.useMutation();
  const leaveMutation = trpc.channel.leave.useMutation();

  // Active auction (polling for real-time updates)
  const { data: activeAuction } = trpc.auction.getActive.useQuery(
    { channelId: channelIdNum },
    { enabled: !!channelId, refetchInterval: 3_000 },
  );

  const handleAuctionEnd = () => {
    if (!activeAuction) return;
    const isWinner = user?.id === activeAuction.highestBidderId;
    setAuctionEndInfo({
      visible: true,
      isWinner,
      productName: activeAuction.productName,
      finalPrice: activeAuction.currentBid,
      winnerUsername: activeAuction.highestBidderUsername,
      orderId: null, // orderId comes from buyout; regular auction end won't have it here
    });
  };

  // Initialize Agora + join
  const initializeAndJoin = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Join via tRPC to get Agora credentials
      const data = await joinMutation.mutateAsync({
        channelId: channelIdNum,
      });

      // 2. Create Agora engine
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({
        appId: data.appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // 3. Register event handlers
      engine.addListener("onUserJoined", (_connection, uid) => {
        console.log("Remote user joined:", uid);
        setRemoteUid(uid);
      });

      engine.addListener("onUserOffline", (_connection, uid) => {
        console.log("Remote user left:", uid);
        setRemoteUid((prev) => (prev === uid ? null : prev));
      });

      engine.addListener("onJoinChannelSuccess", () => {
        console.log("Joined Agora channel successfully");
        setIsJoined(true);
        setIsLoading(false);
      });

      engine.addListener("onError", (_errorCode, msg) => {
        console.error("Agora error:", msg);
      });

      // 4. Join as audience
      engine.setClientRole(ClientRoleType.ClientRoleAudience);
      engine.enableVideo();

      engine.joinChannel(data.token, data.channel.id.toString(), data.uid, {
        clientRoleType: ClientRoleType.ClientRoleAudience,
        autoSubscribeVideo: true,
        autoSubscribeAudio: true,
      });
    } catch (err: any) {
      console.error("Failed to join channel:", err);
      setError(err.message || "Failed to join channel");
      setIsLoading(false);
    }
  }, [channelIdNum]);

  // Cleanup Agora on unmount
  const cleanup = useCallback(async () => {
    const engine = engineRef.current;
    if (engine) {
      engine.leaveChannel();
      engine.removeAllListeners();
      engine.release();
      engineRef.current = null;
    }

    // Leave via API
    try {
      await leaveMutation.mutateAsync({ channelId: channelIdNum });
    } catch {
      // Ignore errors on leave (channel may have ended)
    }
  }, [channelIdNum]);

  useEffect(() => {
    initializeAndJoin();
    return () => {
      cleanup();
    };
  }, []);

  const handleBack = () => {
    cleanup();
    router.back();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) return <LoadingScreen />;

  const viewerCount = participants?.length ?? 0;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Layer */}
      <View style={styles.videoContainer}>
        {remoteUid ? (
          <RtcSurfaceView
            style={styles.video}
            canvas={{
              uid: remoteUid,
              sourceType: VideoSourceType.VideoSourceRemote,
            }}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.placeholderText}>
              Waiting for host to stream...
            </Text>
          </View>
        )}
      </View>

      {/* Overlay Layer */}
      <View style={styles.overlay}>
        {/* Top bar: back + badges */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={12}
          >
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <LiveBadge viewerCount={viewerCount} />
        </View>

        {/* Highlighted product */}
        {highlightedProduct && !activeAuction && (
          <View style={styles.highlightContainer}>
            <HighlightedProduct
              name={highlightedProduct.name}
              price={highlightedProduct.price}
              imageUrl={highlightedProduct.imageUrl}
            />
          </View>
        )}

        {/* Active auction */}
        {activeAuction && activeAuction.status === "active" && (
          <View style={styles.auctionContainer}>
            <AuctionWidget
              auction={activeAuction}
              onAuctionEnd={handleAuctionEnd}
            />
          </View>
        )}

        {/* Chat at bottom */}
        <View style={styles.chatContainer}>
          <ChatPanel channelId={channelIdNum} />
        </View>
      </View>

      {/* Auction end modal */}
      {auctionEndInfo && (
        <AuctionEndModal
          visible={auctionEndInfo.visible}
          isWinner={auctionEndInfo.isWinner}
          productName={auctionEndInfo.productName}
          finalPrice={auctionEndInfo.finalPrice}
          winnerUsername={auctionEndInfo.winnerUsername}
          onClose={() => setAuctionEndInfo(null)}
          onPay={
            auctionEndInfo.isWinner
              ? () => {
                  setAuctionEndInfo(null);
                  // Navigate to orders so user can find & pay
                  router.push("/(tabs)/orders");
                }
              : undefined
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: theme.fontSize.base,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60, // Safe area
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  highlightContainer: {
    paddingHorizontal: 16,
  },
  auctionContainer: {
    paddingHorizontal: 16,
  },
  chatContainer: {
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.destructive,
    fontSize: theme.fontSize.base,
    textAlign: "center",
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  errorButtonText: {
    color: theme.colors.primaryForeground,
    fontWeight: "600",
  },
}));

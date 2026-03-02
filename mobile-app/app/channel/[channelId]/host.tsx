import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { StyleSheet } from "react-native-unistyles";
import { Gavel, MessageSquare, Package } from "lucide-react-native";
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  VideoSourceType,
} from "react-native-agora";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LiveBadge } from "@/components/live/LiveBadge";
import { ChatPanel } from "@/components/live/ChatPanel";
import { ChannelControls } from "@/components/live/ChannelControls";
import { ProductManagementPanel } from "@/components/live/ProductManagementPanel";
import { AuctionConfigModal } from "@/components/live/AuctionConfigModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type ActivePanel = "chat" | "products" | null;

export default function ChannelHostScreen() {
  const { channelId, token, appId, uid } = useLocalSearchParams<{
    channelId: string;
    token: string;
    appId: string;
    uid: string;
  }>();
  const router = useRouter();
  const engineRef = useRef<IRtcEngine | null>(null);
  const { user } = useAuth();

  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<
    number | null
  >(null);
  const [highlightedProductName, setHighlightedProductName] = useState<
    string | null
  >(null);

  // Get channel info for shopId
  const { data: channelData } = trpc.channel.get.useQuery({
    channelId: Number(channelId),
  });

  // Get highlighted product
  const { data: highlightData } = trpc.channel.getHighlightedProduct.useQuery({
    channelId: Number(channelId),
  });

  // Get active auction for display
  const { data: activeAuction } = trpc.auction.getActive.useQuery(
    { channelId: Number(channelId) },
    { refetchInterval: 3000 },
  );

  const endMutation = trpc.channel.end.useMutation({
    onSuccess: () => router.back(),
    onError: (error) => Alert.alert("Error", error.message),
  });

  // Update highlighted product from server
  useEffect(() => {
    if (highlightData?.product) {
      setHighlightedProductId(highlightData.product.id);
      setHighlightedProductName(highlightData.product.name);
    } else {
      setHighlightedProductId(null);
      setHighlightedProductName(null);
    }
  }, [highlightData]);

  // Initialize Agora as broadcaster
  const initAgora = useCallback(async () => {
    if (!token || !appId || !uid) {
      setIsLoading(false);
      return;
    }

    try {
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({
        appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          setIsJoined(true);
          setIsLoading(false);
        },
        onUserJoined: (_connection, _uid) => {
          setViewerCount((c) => c + 1);
        },
        onUserOffline: (_connection, _uid) => {
          setViewerCount((c) => Math.max(0, c - 1));
        },
        onError: (_err, msg) => {
          console.warn("Agora error:", msg);
        },
      });

      // Host publishes audio + video
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.enableVideo();
      engine.enableAudio();
      engine.startPreview();

      engine.joinChannel(token, String(channelId), Number(uid), {
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
      });
    } catch (err: any) {
      console.error("Agora init error:", err);
      Alert.alert("Error", "Failed to start stream.");
      setIsLoading(false);
    }
  }, [token, appId, uid, channelId]);

  useEffect(() => {
    initAgora();
    return () => {
      const engine = engineRef.current;
      if (engine) {
        engine.leaveChannel();
        engine.release();
        engineRef.current = null;
      }
    };
  }, [initAgora]);

  const handleToggleMic = () => {
    const engine = engineRef.current;
    if (engine) {
      engine.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    const engine = engineRef.current;
    if (engine) {
      engine.muteLocalVideoStream(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleSwitchCamera = () => {
    const engine = engineRef.current;
    if (engine) {
      engine.switchCamera();
    }
  };

  const handleEndStream = () => {
    Alert.alert("End Stream", "Are you sure you want to end the live stream?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          const engine = engineRef.current;
          if (engine) {
            engine.leaveChannel();
            engine.release();
            engineRef.current = null;
          }
          endMutation.mutate({ channelId: Number(channelId) });
        },
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  // For ProductManagementPanel, we need a shopId.
  // The channel doesn't directly store shopId, so we use the first shop from the user.
  // In a real scenario, this would come from channel metadata.
  const shopId = 0; // Will be passed from channel creation in future iteration

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Self-view camera */}
      {isJoined && !isVideoOff && (
        <RtcSurfaceView
          style={styles.fullVideo}
          canvas={{
            uid: 0, // 0 = local camera
            sourceType: VideoSourceType.VideoSourceCamera,
          }}
        />
      )}

      {/* Camera off fallback */}
      {isVideoOff && (
        <View style={styles.cameraOffOverlay}>
          <Text style={styles.cameraOffText}>Camera Off</Text>
        </View>
      )}

      {/* Top bar: LIVE badge + viewer count */}
      <View style={styles.topBar}>
        <LiveBadge viewerCount={viewerCount} />
        {activeAuction && (
          <View style={styles.auctionLiveBadge}>
            <Gavel size={14} color="#fff" />
            <Text style={styles.auctionLiveText}>Auction Live</Text>
          </View>
        )}
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        {/* Panel toggle buttons */}
        <View style={styles.panelToggles}>
          <Pressable
            style={[
              styles.panelToggleBtn,
              activePanel === "chat" && styles.panelToggleBtnActive,
            ]}
            onPress={() =>
              setActivePanel(activePanel === "chat" ? null : "chat")
            }
          >
            <MessageSquare size={18} color="#fff" />
          </Pressable>
          <Pressable
            style={[
              styles.panelToggleBtn,
              activePanel === "products" && styles.panelToggleBtnActive,
            ]}
            onPress={() =>
              setActivePanel(activePanel === "products" ? null : "products")
            }
          >
            <Package size={18} color="#fff" />
          </Pressable>
          <Pressable
            style={styles.panelToggleBtn}
            onPress={() => setShowAuctionModal(true)}
          >
            <Gavel size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Active panel */}
        {activePanel === "chat" && (
          <View style={styles.chatContainer}>
            <ChatPanel channelId={Number(channelId)} />
          </View>
        )}

        {activePanel === "products" && (
          <ProductManagementPanel
            channelId={Number(channelId)}
            shopId={shopId}
            highlightedProductId={highlightedProductId}
          />
        )}

        {/* Stream controls */}
        <ChannelControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMic={handleToggleMic}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
          onEndStream={handleEndStream}
        />
      </View>

      {/* Auction config modal */}
      <AuctionConfigModal
        visible={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        highlightedProductId={highlightedProductId}
        highlightedProductName={highlightedProductName}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  cameraOffOverlay: {
    ...({ position: "absolute" } as any),
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraOffText: {
    fontSize: theme.fontSize.lg,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  topBar: {
    position: "absolute",
    top: 60,
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  auctionLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(229,72,77,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  auctionLiveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    zIndex: 10,
  },
  panelToggles: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  panelToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  panelToggleBtnActive: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  chatContainer: {
    height: 250,
    marginBottom: theme.spacing.sm,
  },
}));

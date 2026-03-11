import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Wifi,
  WifiOff,
  ArrowLeft,
  Eye,
  Sparkles,
  Loader2,
  Radio,
} from "lucide-react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { trpc } from "../lib/trpc";
import { isAuthenticated } from "../lib/auth";
import ParticipantList from "../components/ParticipantList";
import PromotedProducts from "../components/PromotedProducts";
import NetworkQuality from "../components/NetworkQuality";
import Button from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useUserRole } from "../hooks/useUserRole";
import { RoleBadge } from "../components/RoleBadge";
import { ChatPanel } from "../components/ChatPanel";
import VerticalControlPanel from "../components/VerticalControlPanel";
import { toast } from "sonner";

interface ChannelConfig {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
  isHost: boolean;
}

export default function LiveDetailsPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { role } = useUserRole();

  // Get current user info
  const { data: currentUser } = trpc.auth.me.useQuery();

  // Agora state
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<
    Map<number, IAgoraRTCRemoteUser>
  >(new Map());

  // Refs to always have current Agora instances for cleanup
  const { t } = useTranslation();
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenTrackRef = useRef<ICameraVideoTrack | null>(null);

  // UI state
  const [joined, setJoined] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [error, setError] = useState("");
  const [, setScreenTrack] = useState<ICameraVideoTrack | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showHighlightedProduct, setShowHighlightedProduct] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig | null>(
    null,
  );
  const [highlightedProduct, setHighlightedProduct] = useState<{
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  } | null>(null);

  // Fetch real participant count (viewers don't publish, so remoteUsers.size is always 0)
  const { data: participantsData } = trpc.live.participants.useQuery(
    { channelId: Number(channelId) },
    {
      enabled: !!channelId && joined,
      refetchInterval: 5000,
    },
  );
  const viewerCount = participantsData
    ? participantsData.filter((p) => !p.isCurrentUser).length
    : 0;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch promoted products for this channel
  const { data: promotedProducts = [] } = trpc.product.listByChannel.useQuery(
    { channelId: Number(channelId) },
    { enabled: !!channelId },
  );

  // Fetch highlighted product on mount
  const { data: highlightedData } = trpc.live.getHighlightedProduct.useQuery(
    { channelId: Number(channelId) },
    { enabled: !!channelId },
  );

  // Update highlighted product when data changes
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

  // WebSocket subscription for channel events (highlight/unhighlight)
  trpc.live.subscribeToEvents.useSubscription(
    { channelId: Number(channelId) },
    {
      enabled: !!channelId,
      onData: (event) => {
        if (event.type === "PRODUCT_HIGHLIGHTED") {
          setHighlightedProduct({
            id: event.product.id,
            name: event.product.name,
            price: event.product.price,
            description: event.product.description,
            imageUrl: event.product.imageUrl,
          });
          toast.success(
            t("channels.details.productHighlighted", {
              name: event.product.name,
            }),
            {
              icon: <Sparkles className="size-4 text-primary" />,
            },
          );
        } else if (event.type === "PRODUCT_UNHIGHLIGHTED") {
          setHighlightedProduct(null);
          toast.info(t("channels.details.productUnhighlighted"));
        }
      },
      onError: (error) => {
        console.error("Channel events subscription error:", error);
      },
    },
  );

  // Join channel mutation
  const joinMutation = trpc.live.join.useMutation({
    onSuccess: async (data) => {
      const config = {
        appId: data.appId,
        token: data.token,
        channelName: data.channel.id.toString(),
        uid: data.uid,
        isHost: data.isHost,
      };
      setChannelConfig(config);
      await initializeAgora(config);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Leave channel mutation
  const leaveMutation = trpc.live.leave.useMutation({
    onSuccess: () => {
      navigate("/lives");
    },
  });

  // Initialize Agora client
  const initializeAgora = async (config: ChannelConfig) => {
    try {
      console.log("🎥 Initializing Agora with config:", {
        appId: config.appId,
        channelName: config.channelName,
        tokenLength: config.token.length,
        tokenPreview: config.token.substring(0, 20) + "...",
      });

      // Create client in "live" mode for broadcast (1 host → many viewers)
      const agoraClient = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      console.log("✅ Agora client created");

      // Add error event listener
      agoraClient.on(
        "connection-state-change",
        (curState, prevState, reason) => {
          console.log("🔄 Connection state change:", {
            from: prevState,
            to: curState,
            reason: reason,
          });
        },
      );

      agoraClient.on("exception", (event) => {
        console.error("⚠️ Agora exception:", event);
      });

      // Event: Remote user published
      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);

        if (mediaType === "video") {
          setRemoteUsers((prev) => new Map(prev).set(user.uid as number, user));
          console.log(`User ${user.uid} joined with video`);
        }

        if (mediaType === "audio") {
          user.audioTrack?.play();
        }
      });

      // Event: Remote user unpublished
      agoraClient.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(user.uid as number);
            return newMap;
          });
        }
      });

      // Event: Remote user left
      agoraClient.on("user-left", (user) => {
        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(user.uid as number);
          return newMap;
        });
        console.log(`User ${user.uid} left the channel`);
      });

      // Join channel with the same UID that was used to generate the token
      // If we get UID_CONFLICT, it means we're already connected - leave first
      let assignedUid;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          assignedUid = await agoraClient.join(
            config.appId,
            config.channelName,
            config.token,
            config.uid,
          );
          console.log(
            "✅ Successfully joined Agora channel with UID:",
            assignedUid,
          );
          break; // Success, exit the loop
        } catch (err: any) {
          if (err.code === "UID_CONFLICT" && retryCount < maxRetries) {
            retryCount++;
            console.warn(
              `⚠️ UID conflict detected (attempt ${retryCount}/${maxRetries}), leaving and rejoining...`,
            );
            try {
              await agoraClient.leave();
            } catch (leaveErr) {
              console.warn("Error leaving channel:", leaveErr);
            }
            // Wait with exponential backoff
            const waitTime = 1000 * retryCount;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } else {
            // Either not a UID_CONFLICT or we've exhausted retries
            throw err;
          }
        }
      }

      if (!assignedUid) {
        throw new Error("Failed to join channel after retries");
      }

      // Set client role: host can publish, audience can only subscribe
      await agoraClient.setClientRole(config.isHost ? "host" : "audience");
      console.log(
        `✅ Client role set to: ${config.isHost ? "host" : "audience"}`,
      );

      // Only create and publish tracks for hosts (broadcasters)
      if (config.isHost) {
        console.log(
          "🎥 Creating local video and audio tracks (broadcaster mode)...",
        );

        try {
          // Check for device permissions first
          const devices = await AgoraRTC.getDevices();
          console.log("📱 Available devices:", devices);

          const cameras = devices.filter((d) => d.kind === "videoinput");
          const microphones = devices.filter((d) => d.kind === "audioinput");

          console.log(
            `🎥 Found ${cameras.length} camera(s), ${microphones.length} microphone(s)`,
          );

          if (cameras.length === 0 || microphones.length === 0) {
            throw new Error(
              `Missing devices: ${cameras.length === 0 ? "No camera" : ""} ${microphones.length === 0 ? "No microphone" : ""}`,
            );
          }

          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          console.log("✅ Local tracks created");

          await agoraClient.publish([videoTrack, audioTrack]);
          console.log("✅ Local tracks published");

          setLocalVideoTrack(videoTrack);
          setLocalAudioTrack(audioTrack);

          // Sync refs
          localVideoTrackRef.current = videoTrack;
          localAudioTrackRef.current = audioTrack;

          // Wait for DOM to update, then play local video
          setTimeout(() => {
            const localPlayerElement = document.getElementById("local-player");
            console.log(
              "🎬 Playing local video to element:",
              localPlayerElement,
            );
            if (localPlayerElement) {
              videoTrack.play("local-player");
              console.log("✅ Local video playing");
            } else {
              console.error("❌ local-player element not found!");
            }
          }, 100);
        } catch (trackErr: any) {
          console.error("❌ Failed to create/publish tracks:", trackErr);
          throw new Error(
            `Failed to access camera/microphone: ${trackErr.message}`,
          );
        }
      } else {
        console.log(
          "👁️ Joined as viewer (audience mode) - not publishing tracks",
        );
      }

      setClient(agoraClient);
      setJoined(true);

      // Sync refs
      clientRef.current = agoraClient;

      console.log(
        `Successfully joined the channel as ${config.isHost ? "broadcaster" : "viewer"}!`,
      );
    } catch (err: any) {
      // Don't show error if it was a UID_CONFLICT that we handled
      if (err.code === "UID_CONFLICT") {
        console.log("⚠️ UID_CONFLICT was handled, ignoring error display");
        return;
      }

      console.error("❌ Failed to initialize Agora:", err);
      console.error("❌ Error details:", {
        name: err.name,
        code: err.code,
        message: err.message,
        data: err.data,
        stack: err.stack,
      });
      setError(err.message || "Failed to join channel");
      alert(`Failed to join channel: ${err.message || "Unknown error"}`);
    }
  };

  // Join channel on mount
  useEffect(() => {
    if (channelId) {
      joinMutation.mutate({ channelId: Number(channelId) });
    }
  }, [channelId]);

  // Cleanup on unmount - safety net only (main cleanup is in handleLeave)
  useEffect(() => {
    return () => {
      // Only cleanup if handleLeave didn't already do it
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
        clientRef.current = null;
      }
    };
  }, []);

  // Play local video when track is available
  useEffect(() => {
    if (localVideoTrack && joined) {
      const playLocalVideo = () => {
        const localPlayerElement = document.getElementById("local-player");
        console.log("🎬 Attempting to play local video:", {
          track: localVideoTrack,
          element: localPlayerElement,
        });
        if (localPlayerElement) {
          try {
            localVideoTrack.play("local-player");
            console.log("✅ Local video started playing");
          } catch (err) {
            console.error("❌ Failed to play local video:", err);
          }
        } else {
          console.error("❌ local-player element not found in DOM");
        }
      };

      // Try immediately
      playLocalVideo();

      // Also try after a small delay in case DOM isn't ready
      const timeout = setTimeout(playLocalVideo, 200);

      return () => clearTimeout(timeout);
    }
  }, [localVideoTrack, joined]);

  // Play remote videos when users update
  useEffect(() => {
    remoteUsers.forEach((user, uid) => {
      if (user.videoTrack) {
        const playerId = `remote-player-${uid}`;
        const playerElement = document.getElementById(playerId);
        if (playerElement) {
          user.videoTrack.play(playerId);
        }
      }
    });
  }, [remoteUsers]);

  // Toggle audio
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!audioMuted);
      setAudioMuted(!audioMuted);
      console.log(audioMuted ? "Microphone unmuted" : "Microphone muted");
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!videoMuted);
      setVideoMuted(!videoMuted);
      console.log(videoMuted ? "Camera turned on" : "Camera turned off");
    }
  };

  // Force leave - skip waiting for Agora cleanup
  const forceLeave = useCallback(() => {
    console.log("⚡ Force leaving channel...");

    // Best-effort synchronous cleanup
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current.close();
      screenTrackRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.leave().catch(() => {});
      clientRef.current = null;
    }

    setClient(null);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setScreenTrack(null);
    setRemoteUsers(new Map());
    setJoined(false);
    setIsLeaving(false);

    if (channelId) {
      leaveMutation.mutate({ channelId: Number(channelId) });
    }
    navigate("/lives");
  }, [channelId, navigate, leaveMutation]);

  // Leave channel - show dialog, cleanup with timeout, then navigate
  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    console.log("👋 Leaving channel...");

    try {
      // 1. Stop and close tracks (synchronous - releases camera/mic)
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        console.log("✅ Video track stopped and closed");
        localVideoTrackRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        console.log("✅ Audio track stopped and closed");
        localAudioTrackRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }

      // 2. Leave Agora channel with a timeout (can hang)
      if (clientRef.current) {
        const leavePromise = clientRef.current.leave();
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("Leave timeout")), 5000),
        );

        try {
          await Promise.race([leavePromise, timeoutPromise]);
          console.log("✅ Left Agora channel");
        } catch (err) {
          console.warn("⚠️ Agora leave timed out or failed:", err);
        }
        clientRef.current = null;
      }

      // 3. Clear state and navigate
      setClient(null);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setScreenTrack(null);
      setRemoteUsers(new Map());
      setJoined(false);
      setIsLeaving(false);

      if (channelId) {
        leaveMutation.mutate({ channelId: Number(channelId) });
      }
      navigate("/lives");
    } catch (err) {
      console.error("❌ Error leaving channel:", err);
      forceLeave();
    }
  }, [channelId, navigate, leaveMutation, forceLeave]);

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <WifiOff className="size-16 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">
                {t("channels.details.connectionError")}
              </h2>
              <div className="text-destructive">{error}</div>
              <Button asChild>
                <Link to="/lives">
                  <ArrowLeft className="size-4 mr-2" />
                  {t("channels.details.backToChannels")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wifi className="size-16 mx-auto text-primary animate-pulse" />
          <h2 className="text-xl font-semibold">
            {t("channels.details.joiningChannel")}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex items-center justify-center p-0 lg:p-4">
      {/* Main Vertical Container */}
      <div className="relative w-full h-full lg:w-full lg:max-w-[600px] lg:h-[90vh]">
        {/* Aspect Ratio Container - Full screen on mobile, 9:16 on desktop */}
        <div className="absolute inset-0 lg:aspect-[9/16] lg:mx-auto bg-black lg:rounded-lg overflow-hidden">
          {/* Main Video Container */}
          <div className="relative w-full h-full bg-black">
            {channelConfig?.isHost ? (
              /* Host Self-View: Local video displayed full-screen in the main area */
              <div className="w-full h-full">
                <div
                  id="local-player"
                  className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"
                />
              </div>
            ) : Array.from(remoteUsers.entries()).length > 0 ? (
              /* Viewer: Show the broadcaster's remote video */
              <div className="w-full h-full">
                {Array.from(remoteUsers.entries()).map(([uid], index) => {
                  if (index === 0) {
                    return (
                      <div key={uid} className="w-full h-full relative">
                        <div
                          id={`remote-player-${uid}`}
                          className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              /* Viewer: Placeholder when broadcaster hasn't started */
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4 text-white">
                  <Eye className="size-16 mx-auto text-white/60" />
                  <h3 className="text-lg font-semibold">
                    {t("channels.details.waitingForBroadcaster")}
                  </h3>
                  <p className="text-sm text-white/60">
                    {t("channels.details.streamWillAppear")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LIVE Badge - Only for the host */}
          {channelConfig?.isHost && joined && (
            <div className="absolute top-16 left-4 z-30 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-md shadow-lg">
                <Radio className="size-3.5 text-white animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
                <Eye className="size-3.5 text-foreground" />
                <span className="text-xs font-medium text-foreground">
                  {viewerCount}
                </span>
              </div>
            </div>
          )}

          {/* Control Bar - For all users, but only broadcasters get audio/video controls */}
          <div className="absolute bottom-4 right-4 z-30">
            <VerticalControlPanel
              audioMuted={audioMuted}
              videoMuted={videoMuted}
              viewerCount={viewerCount}
              productCount={promotedProducts.filter((p) => p.isActive).length}
              highlightedProductCount={highlightedProduct ? 1 : 0}
              showBroadcastControls={channelConfig?.isHost ?? false}
              onToggleAudio={channelConfig?.isHost ? toggleAudio : undefined}
              onToggleVideo={channelConfig?.isHost ? toggleVideo : undefined}
              onShowParticipants={() => setShowParticipants(true)}
              onShowProducts={() => setShowProducts(true)}
              onToggleHighlightedProduct={() =>
                setShowHighlightedProduct(!showHighlightedProduct)
              }
            />
          </div>

          {/* Chat Panel - Bottom overlay, positioned to left of controls */}
          {currentUser && channelId && (
            <div className="absolute inset-0 right-20 z-20">
              <ChatPanel
                channelId={Number(channelId)}
                currentUserId={currentUser.id}
                highlightedProduct={highlightedProduct}
                showHighlightedProduct={showHighlightedProduct}
                onToggleHighlightedProduct={() =>
                  setShowHighlightedProduct(!showHighlightedProduct)
                }
                isHost={channelConfig?.isHost ?? false}
              />
            </div>
          )}

          {/* Minimal Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLeave}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="size-5" />
              </Button>

              <div className="flex items-center gap-2">
                <RoleBadge role={role} />
                <NetworkQuality client={client} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ParticipantList
        channelId={Number(channelId)}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
      />

      <PromotedProducts
        products={promotedProducts}
        isOpen={showProducts}
        onClose={() => setShowProducts(false)}
        channelId={Number(channelId)}
        canHighlight={channelConfig?.isHost ?? false}
        highlightedProductId={highlightedProduct?.id}
      />

      {/* Leaving Channel Dialog */}
      <Dialog open={isLeaving} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-primary" />
              {t("channels.details.stoppingChannel")}
            </DialogTitle>
            <DialogDescription>
              {t("channels.details.stoppingDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={forceLeave}>
              {t("channels.details.doNotWait")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

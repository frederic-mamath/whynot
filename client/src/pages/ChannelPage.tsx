import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Users as UsersIcon,
  Wifi,
  WifiOff,
  ArrowLeft,
  Eye,
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
import NetworkQuality from "../components/NetworkQuality";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { useUserRole } from "../hooks/useUserRole";
import { RoleBadge } from "../components/RoleBadge";
import { ChatPanel } from "../components/ChatPanel";

interface ChannelConfig {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
}

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { role, canPublish, isLoading: roleLoading } = useUserRole();

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

  // UI state
  const [joined, setJoined] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [error, setError] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<ICameraVideoTrack | null>(
    null,
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig | null>(
    null,
  );

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  // Join channel mutation
  const joinMutation = trpc.channel.join.useMutation({
    onSuccess: async (data) => {
      const config = {
        appId: data.appId,
        token: data.token,
        channelName: data.channel.id.toString(),
        uid: data.uid,
      };
      setChannelConfig(config);
      await initializeAgora(config);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Leave channel mutation
  const leaveMutation = trpc.channel.leave.useMutation({
    onSuccess: () => {
      navigate("/channels");
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

      // Create client
      const agoraClient = AgoraRTC.createClient({
        mode: "rtc",
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

      // Only create and publish tracks for sellers (broadcasters)
      if (canPublish) {
        console.log(
          "🎥 Creating local video and audio tracks (broadcaster mode)...",
        );
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log("✅ Local tracks created");

        await agoraClient.publish([videoTrack, audioTrack]);
        console.log("✅ Local tracks published");

        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        // Wait for DOM to update, then play local video
        setTimeout(() => {
          const localPlayerElement = document.getElementById("local-player");
          console.log("🎬 Playing local video to element:", localPlayerElement);
          if (localPlayerElement) {
            videoTrack.play("local-player");
            console.log("✅ Local video playing");
          } else {
            console.error("❌ local-player element not found!");
          }
        }, 100);
      } else {
        console.log(
          "👁️ Joined as viewer (audience mode) - not publishing tracks",
        );
      }

      setClient(agoraClient);
      setJoined(true);

      console.log(
        `Successfully joined the channel as ${canPublish ? "broadcaster" : "viewer"}!`,
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up Agora connection...");
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (client) {
        client
          .leave()
          .then(() => {
            console.log("✅ Successfully left Agora channel");
          })
          .catch((err) => {
            console.error("❌ Error leaving channel:", err);
          });
      }
    };
  }, [client, localVideoTrack, localAudioTrack]);

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

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!client) return;

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        console.log("Starting screen share...");
        const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: "1080p_1",
        });

        // Unpublish camera
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
          localVideoTrack.stop();
          localVideoTrack.close();
        }

        // Publish screen
        await client.publish([screenVideoTrack as any]);
        setScreenTrack(screenVideoTrack as any);
        setIsScreenSharing(true);
        console.log("Screen sharing started!");

        // Play screen share locally
        setTimeout(() => {
          const localPlayerElement = document.getElementById("local-player");
          if (localPlayerElement) {
            (screenVideoTrack as any).play("local-player");
          }
        }, 100);

        // Listen for screen share stop (user clicks browser's stop button)
        (screenVideoTrack as any).on("track-ended", () => {
          stopScreenShare();
        });
      } else {
        // Stop screen sharing
        await stopScreenShare();
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
      alert("Failed to share screen: " + err.message);
    }
  };

  const stopScreenShare = async () => {
    if (!client || !screenTrack) return;

    try {
      // Unpublish and close screen track
      await client.unpublish([screenTrack as any]);
      screenTrack.stop();
      screenTrack.close();
      setScreenTrack(null);
      setIsScreenSharing(false);

      // Re-publish camera
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      await client.publish([videoTrack]);
      setLocalVideoTrack(videoTrack);

      setTimeout(() => {
        const localPlayerElement = document.getElementById("local-player");
        if (localPlayerElement) {
          videoTrack.play("local-player");
        }
      }, 100);

      console.log("Screen sharing stopped");
    } catch (err: any) {
      console.error("Error stopping screen share:", err);
      alert("Failed to stop screen share");
    }
  };

  // Leave channel
  const handleLeave = async () => {
    try {
      console.log("👋 Leaving channel...");

      // Stop and close tracks if they exist (only for broadcasters)
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (screenTrack) {
        screenTrack.stop();
        screenTrack.close();
      }

      // Leave Agora channel
      if (client) {
        await client.leave();
        console.log("✅ Left Agora channel");
      }

      // Clear state
      setClient(null);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setScreenTrack(null);
      setRemoteUsers(new Map());
      setJoined(false);

      // Notify backend
      if (channelId) {
        leaveMutation.mutate({ channelId: Number(channelId) });
      }

      // Navigate away
      navigate("/channels");
    } catch (err) {
      console.error("❌ Error leaving channel:", err);
      // Navigate anyway
      navigate("/channels");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <WifiOff className="size-16 mx-auto text-destructive" />
              <h2 className="text-xl font-semibold">Connection Error</h2>
              <div className="text-destructive">{error}</div>
              <Button asChild>
                <Link to="/channels">
                  <ArrowLeft className="size-4 mr-2" />
                  Back to Channels
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
          <h2 className="text-xl font-semibold">Joining channel...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                  <Video className="size-4 sm:size-5 text-primary" />
                  <span className="hidden sm:inline">Live Channel</span>
                </h2>
                <RoleBadge role={role} />
                <NetworkQuality client={client} />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeave}
                className="text-xs sm:text-sm"
              >
                <PhoneOff className="size-3 sm:size-4 sm:mr-2" />
                <span className="hidden sm:inline">Leave</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-2 sm:p-4">
          <div className="max-w-7xl mx-auto h-full">
            {Array.from(remoteUsers.entries()).length === 0 ? (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center space-y-3 sm:space-y-4">
                  {canPublish ? (
                    <>
                      <UsersIcon className="size-12 sm:size-16 mx-auto text-muted-foreground" />
                      <h3 className="text-base sm:text-lg font-semibold">
                        Waiting for participants
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Invite others to join this channel
                      </p>
                    </>
                  ) : (
                    <>
                      <Eye className="size-12 sm:size-16 mx-auto text-muted-foreground" />
                      <h3 className="text-base sm:text-lg font-semibold">
                        Waiting for broadcaster
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        The stream will appear when the broadcaster starts
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 h-full">
                {Array.from(remoteUsers.entries()).map(([uid, user]) => (
                  <div
                    key={uid}
                    className="relative bg-card rounded-lg overflow-hidden border border-border aspect-video"
                  >
                    <div
                      id={`remote-player-${uid}`}
                      className="w-full h-full"
                    ></div>
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-2 sm:px-3 py-1 bg-background/80 backdrop-blur-sm rounded-md text-xs sm:text-sm font-medium">
                      User {uid}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) - Only for Broadcasters */}
        {canPublish && localVideoTrack && (
          <div className="fixed bottom-20 sm:bottom-24 right-2 sm:right-6 w-32 sm:w-48 md:w-64 z-50">
            <div className="relative bg-card rounded-lg overflow-hidden border-2 border-primary shadow-lg aspect-video">
              <div id="local-player" className="w-full h-full"></div>
              <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-background/80 backdrop-blur-sm rounded text-[10px] sm:text-xs font-medium">
                You
              </div>
            </div>
          </div>
        )}

        {/* Control Bar - Only for Broadcasters */}
        {canPublish && (
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-2 w-full sm:w-auto">
            <div className="bg-card border border-border rounded-full shadow-lg px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-center gap-1 sm:gap-2 max-w-full overflow-x-auto">
              <Button
                variant={audioMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleAudio}
                title={audioMuted ? "Unmute" : "Mute"}
                className="shrink-0"
              >
                {audioMuted ? (
                  <MicOff className="size-4 sm:size-5" />
                ) : (
                  <Mic className="size-4 sm:size-5" />
                )}
              </Button>

              <Button
                variant={videoMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleVideo}
                title={videoMuted ? "Turn on camera" : "Turn off camera"}
                className="shrink-0"
              >
                {videoMuted ? (
                  <VideoOff className="size-4 sm:size-5" />
                ) : (
                  <Video className="size-4 sm:size-5" />
                )}
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                onClick={toggleScreenShare}
                title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                className="shrink-0 hidden sm:flex"
              >
                <MonitorUp className="size-4 sm:size-5" />
              </Button>

              <div className="w-px h-6 sm:h-8 bg-border mx-0.5 sm:mx-1 hidden sm:block"></div>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowParticipants(true)}
                title="Show participants"
                className="shrink-0 relative"
              >
                <UsersIcon className="size-4 sm:size-5" />
                <span className="absolute -top-1 -right-1 size-4 sm:size-5 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs flex items-center justify-center font-medium">
                  {Array.from(remoteUsers.values()).length + 1}
                </span>
              </Button>

              <div className="w-px h-6 sm:h-8 bg-border mx-0.5 sm:mx-1"></div>

              <Button
                variant="destructive"
                size="icon"
                onClick={handleLeave}
                title="Leave channel"
                className="shrink-0"
              >
                <PhoneOff className="size-4 sm:size-5" />
              </Button>
            </div>
          </div>
        )}

        <ParticipantList
          localUserId={channelConfig?.uid || 0}
          remoteUsers={Array.from(remoteUsers.values())}
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
        />
      </div>

      {/* Chat Panel - Bottom on Mobile, Sidebar on Desktop */}
      {currentUser && channelId && (
        <div className="w-full lg:w-80 xl:w-96 h-64 lg:h-auto border-t lg:border-t-0 lg:border-l">
          <ChatPanel
            channelId={Number(channelId)}
            currentUserId={currentUser.id}
          />
        </div>
      )}
    </div>
  );
}

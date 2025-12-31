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
    <div className="min-h-screen bg-background flex items-center justify-center p-0 lg:p-4">
      {/* Main Vertical Container */}
      <div className="relative w-full max-w-[600px] h-screen lg:h-[90vh]">
        {/* Aspect Ratio Container (9:16) */}
        <div className="absolute inset-0 aspect-[9/16] mx-auto bg-black rounded-none lg:rounded-lg overflow-hidden">
          
          {/* Minimal Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
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

          {/* Main Video Container */}
          <div className="relative w-full h-full bg-black">
            {/* Remote User Video (Primary - The Broadcaster) */}
            {Array.from(remoteUsers.entries()).length > 0 ? (
              <div className="w-full h-full">
                {Array.from(remoteUsers.entries()).map(([uid, user], index) => {
                  // Only show first remote user (broadcaster) in main view
                  if (index === 0) {
                    return (
                      <div key={uid} className="w-full h-full relative">
                        <div
                          id={`remote-player-${uid}`}
                          className="w-full h-full [&>div]:!h-full [&_video]:!object-cover"
                        />
                        
                        {/* Broadcaster Info Overlay (Top) */}
                        <div className="absolute top-20 left-4 flex items-center gap-2">
                          <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">
                              {uid.toString().slice(0, 2)}
                            </span>
                          </div>
                          <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-sm font-medium">User {uid}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              // Placeholder when no broadcaster
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-4 text-white">
                  {canPublish ? (
                    <>
                      <UsersIcon className="size-16 mx-auto text-white/60" />
                      <h3 className="text-lg font-semibold">Waiting for participants</h3>
                      <p className="text-sm text-white/60">
                        Invite others to join this channel
                      </p>
                    </>
                  ) : (
                    <>
                      <Eye className="size-16 mx-auto text-white/60" />
                      <h3 className="text-lg font-semibold">Waiting for broadcaster</h3>
                      <p className="text-sm text-white/60">
                        The stream will appear when the broadcaster starts
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) - Only for Broadcasters */}
          {canPublish && localVideoTrack && (
            <div className="absolute top-20 right-4 w-24 h-32 z-20">
              <div className="relative bg-card rounded-lg overflow-hidden border-2 border-primary shadow-lg">
                <div id="local-player" className="w-full h-full [&_video]:!object-cover" />
                <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
                  You
                </div>
              </div>
            </div>
          )}

          {/* Control Bar - Only for Broadcasters (Horizontal for now, will be vertical in Phase 2) */}
          {canPublish && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-2 w-full max-w-md">
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-lg px-3 py-2 flex items-center justify-center gap-1">
                <Button
                  variant={audioMuted ? "destructive" : "secondary"}
                  size="icon"
                  onClick={toggleAudio}
                  title={audioMuted ? "Unmute" : "Mute"}
                  className="shrink-0"
                >
                  {audioMuted ? (
                    <MicOff className="size-4" />
                  ) : (
                    <Mic className="size-4" />
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
                    <VideoOff className="size-4" />
                  ) : (
                    <Video className="size-4" />
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowParticipants(true)}
                  title="Show participants"
                  className="shrink-0 relative"
                >
                  <UsersIcon className="size-4" />
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {Array.from(remoteUsers.values()).length + 1}
                  </span>
                </Button>

                <div className="w-px h-6 bg-border mx-1"></div>

                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleLeave}
                  title="Leave channel"
                  className="shrink-0"
                >
                  <PhoneOff className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Chat Panel - Bottom overlay (temporary position, will be adjusted in Phase 3) */}
          {currentUser && channelId && (
            <div className="absolute bottom-0 left-0 right-0 h-64 z-20 bg-gradient-to-t from-black/80 to-transparent">
              <ChatPanel
                channelId={Number(channelId)}
                currentUserId={currentUser.id}
              />
            </div>
          )}
        </div>
      </div>

      <ParticipantList
        localUserId={channelConfig?.uid || 0}
        remoteUsers={Array.from(remoteUsers.values())}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
      />
    </div>
  );
}

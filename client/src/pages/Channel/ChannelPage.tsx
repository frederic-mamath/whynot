import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { trpc } from '../../lib/trpc';
import { isAuthenticated } from '../../lib/auth';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import ParticipantList from '../../components/ParticipantList';
import NetworkQuality from '../../components/NetworkQuality';
import styles from './ChannelPage.module.scss';

interface ChannelConfig {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
}

export default function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

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
  const [screenTrack, setScreenTrack] = useState<ICameraVideoTrack | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig | null>(null);

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
      console.log('🎥 Initializing Agora with config:', {
        appId: config.appId,
        channelName: config.channelName,
        tokenLength: config.token.length,
        tokenPreview: config.token.substring(0, 20) + '...',
      });

      // Create client
      const agoraClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      console.log('✅ Agora client created');

      // Add error event listener
      agoraClient.on('connection-state-change', (curState, prevState, reason) => {
        console.log('🔄 Connection state change:', {
          from: prevState,
          to: curState,
          reason: reason,
        });
      });

      agoraClient.on('exception', (event) => {
        console.error('⚠️ Agora exception:', event);
      });

      // Event: Remote user published
      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);

        if (mediaType === "video") {
          setRemoteUsers((prev) => new Map(prev).set(user.uid as number, user));
          toast.success(`User ${user.uid} joined with video`);
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
        toast.info(`User ${user.uid} left the channel`);
      });

      console.log('🔌 Joining Agora channel...');
      console.log('   - App ID:', config.appId);
      console.log('   - Channel:', config.channelName);
      console.log('   - UID:', config.uid);
      console.log('   - Token (first 30 chars):', config.token.substring(0, 30));

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
          console.log('✅ Successfully joined Agora channel with UID:', assignedUid);
          break; // Success, exit the loop
        } catch (err: any) {
          if (err.code === 'UID_CONFLICT' && retryCount < maxRetries) {
            retryCount++;
            console.warn(`⚠️ UID conflict detected (attempt ${retryCount}/${maxRetries}), leaving and rejoining...`);
            try {
              await agoraClient.leave();
            } catch (leaveErr) {
              console.warn('Error leaving channel:', leaveErr);
            }
            // Wait with exponential backoff
            const waitTime = 1000 * retryCount;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            // Either not a UID_CONFLICT or we've exhausted retries
            throw err;
          }
        }
      }

      if (!assignedUid) {
        throw new Error('Failed to join channel after retries');
      }

      // Create and publish local tracks
      console.log('🎥 Creating local video and audio tracks...');
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('✅ Local tracks created');

      await agoraClient.publish([videoTrack, audioTrack]);
      console.log('✅ Local tracks published');

      setClient(agoraClient);
      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
      setJoined(true);
      
      toast.success('Successfully joined the channel!');

      // Wait for DOM to update, then play local video
      setTimeout(() => {
        const localPlayerElement = document.getElementById("local-player");
        console.log('🎬 Playing local video to element:', localPlayerElement);
        if (localPlayerElement) {
          videoTrack.play("local-player");
          console.log('✅ Local video playing');
        } else {
          console.error('❌ local-player element not found!');
        }
      }, 100);
    } catch (err: any) {
      // Don't show error if it was a UID_CONFLICT that we handled
      if (err.code === 'UID_CONFLICT') {
        console.log('⚠️ UID_CONFLICT was handled, ignoring error display');
        return;
      }
      
      console.error('❌ Failed to initialize Agora:', err);
      console.error('❌ Error details:', {
        name: err.name,
        code: err.code,
        message: err.message,
        data: err.data,
        stack: err.stack,
      });
      setError(err.message || "Failed to join channel");
      toast.error(`Failed to join channel: ${err.message || 'Unknown error'}`);
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
      console.log('🧹 Cleaning up Agora connection...');
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (client) {
        client.leave().then(() => {
          console.log('✅ Successfully left Agora channel');
        }).catch((err) => {
          console.error('❌ Error leaving channel:', err);
        });
      }
    };
  }, [client, localVideoTrack, localAudioTrack]);

  // Play local video when track is available
  useEffect(() => {
    if (localVideoTrack && joined) {
      const playLocalVideo = () => {
        const localPlayerElement = document.getElementById("local-player");
        console.log('🎬 Attempting to play local video:', {
          track: localVideoTrack,
          element: localPlayerElement,
        });
        if (localPlayerElement) {
          try {
            localVideoTrack.play("local-player");
            console.log('✅ Local video started playing');
          } catch (err) {
            console.error('❌ Failed to play local video:', err);
          }
        } else {
          console.error('❌ local-player element not found in DOM');
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
      toast.success(audioMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!videoMuted);
      setVideoMuted(!videoMuted);
      toast.success(videoMuted ? 'Camera turned on' : 'Camera turned off');
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!client) return;

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        toast.info('Starting screen share...');
        const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '1080p_1',
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
        toast.success('Screen sharing started!');

        // Play screen share locally
        setTimeout(() => {
          const localPlayerElement = document.getElementById("local-player");
          if (localPlayerElement) {
            (screenVideoTrack as any).play("local-player");
          }
        }, 100);

        // Listen for screen share stop (user clicks browser's stop button)
        (screenVideoTrack as any).on('track-ended', () => {
          stopScreenShare();
        });
      } else {
        // Stop screen sharing
        await stopScreenShare();
      }
    } catch (err: any) {
      console.error('Screen share error:', err);
      toast.error('Failed to share screen: ' + err.message);
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

      toast.success('Screen sharing stopped');
    } catch (err: any) {
      console.error('Error stopping screen share:', err);
      toast.error('Failed to stop screen share');
    }
  };

  // Leave channel
  const handleLeave = async () => {
    try {
      console.log('👋 Leaving channel...');
      
      // Stop and close tracks first
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      
      // Leave Agora channel
      if (client) {
        await client.leave();
        console.log('✅ Left Agora channel');
      }
      
      // Clear state
      setClient(null);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setRemoteUsers(new Map());
      setJoined(false);
      
      // Notify backend
      if (channelId) {
        leaveMutation.mutate({ channelId: Number(channelId) });
      }
      
      // Navigate away
      navigate("/channels");
    } catch (err) {
      console.error('❌ Error leaving channel:', err);
      // Navigate anyway
      navigate("/channels");
    }
  };

  if (error) {
    return (
      <div className={styles.channelError}>
        <div className={styles.errorMessage}>{error}</div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/channels")}
        >
          Back to Channels
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className={styles.channelLoading}>
        <div>Joining channel...</div>
      </div>
    );
  }

  return (
    <div className={styles.channelPage}>
      <div className={styles.channelHeader}>
        <h2>Live Channel</h2>
        <NetworkQuality client={client} />
        <button className="btn btn-secondary" onClick={handleLeave}>
          Leave Channel
        </button>
      </div>

      <div className={styles.videoGrid}>
        {/* Remote videos only - show message if no remote users */}
        {Array.from(remoteUsers.entries()).length === 0 ? (
          <div style={{ 
            color: 'white', 
            textAlign: 'center', 
            padding: '40px',
            gridColumn: '1 / -1'
          }}>
            Waiting for other participants to join...
          </div>
        ) : (
          Array.from(remoteUsers.entries()).map(([uid, user]) => (
            <div
              key={uid}
              className={`${styles.videoContainer} ${styles.remote}`}
            >
              <div
                id={`remote-player-${uid}`}
                className={styles.videoPlayer}
              ></div>
              <div className={styles.videoLabel}>User {uid}</div>
            </div>
          ))
        )}
      </div>

      {/* Local video - fixed in bottom right corner */}
      <div className={`${styles.videoContainer} ${styles.local}`}>
        <div id="local-player" className={styles.videoPlayer}></div>
        <div className={styles.videoLabel}>You</div>
      </div>

      <div className={styles.channelControls}>
        <Button
          variant={audioMuted ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleAudio}
          title={audioMuted ? "Unmute" : "Mute"}
        >
          {audioMuted ? "🔇" : "🎤"}
        </Button>

        <Button
          variant={videoMuted ? "destructive" : "secondary"}
          size="lg"
          onClick={toggleVideo}
          title={videoMuted ? "Turn on camera" : "Turn off camera"}
        >
          {videoMuted ? "📹" : "📷"}
        </Button>

        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
        >
          {isScreenSharing ? "🛑" : "🖥️"}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowParticipants(true)}
          title="Show participants"
        >
          👥 ({Array.from(remoteUsers.values()).length + 1})
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleLeave}
          title="Leave channel"
        >
          📞
        </Button>
      </div>

      {/* Participant List Modal */}
      <ParticipantList
        localUserId={channelConfig?.uid || 0}
        remoteUsers={Array.from(remoteUsers.values())}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
      />
    </div>
  );
}

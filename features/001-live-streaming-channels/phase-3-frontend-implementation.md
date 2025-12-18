# Phase 3: Frontend Implementation

**Status**: To Do  
**Estimated Time**: 4 hours  
**Dependencies**: Phase 2 completed

---

## Objectives

- Create UI pages for channel management
- Integrate Agora RTC SDK for video/audio streaming
- Implement channel creation, joining, and leaving
- Build video grid UI with local and remote streams
- Add controls for mute/unmute audio/video

---

## Tasks

### 3.1 Channel List Page

**Location**: `client/src/pages/Channels.tsx`

**Implementation**:
```typescript
import { trpc } from '../lib/trpc';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { isAuthenticated } from '../lib/auth';

export default function Channels() {
  const navigate = useNavigate();
  const { data: channels, isLoading } = trpc.channel.list.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading channels...</div>
      </div>
    );
  }

  return (
    <div className="channels-container">
      <div className="channels-header">
        <h1>Live Channels</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/create-channel')}
        >
          Create Channel
        </button>
      </div>

      <div className="channels-grid">
        {channels?.length === 0 && (
          <div className="empty-state">
            <p>No active channels. Be the first to create one!</p>
          </div>
        )}

        {channels?.map((channel) => (
          <div key={channel.id} className="channel-card">
            <div className="channel-info">
              <h3>{channel.name}</h3>
              <div className="channel-meta">
                <span className="participant-count">
                  👥 {channel.participantCount} / {channel.maxParticipants}
                </span>
                {channel.isPrivate && (
                  <span className="badge-private">🔒 Private</span>
                )}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/channel/${channel.id}`)}
              disabled={channel.participantCount >= channel.maxParticipants}
            >
              {channel.participantCount >= channel.maxParticipants
                ? 'Full'
                : 'Join'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3.2 Create Channel Page

**Location**: `client/src/pages/CreateChannel.tsx`

**Implementation**:
```typescript
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { isAuthenticated } from '../lib/auth';

export default function CreateChannel() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const createMutation = trpc.channel.create.useMutation({
    onSuccess: (data) => {
      navigate(`/channel/${data.channel.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.length < 3) {
      setError('Channel name must be at least 3 characters');
      return;
    }

    createMutation.mutate({
      name,
      maxParticipants,
      isPrivate,
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Live Channel</h1>
        <p>Start a new live video/audio channel</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Channel Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Stream"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxParticipants">Max Participants</label>
            <input
              type="number"
              id="maxParticipants"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              min={2}
              max={50}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span>Make this channel private</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Channel'}
          </button>
        </form>

        <div className="auth-link">
          <a onClick={() => navigate('/channels')}>← Back to channels</a>
        </div>
      </div>
    </div>
  );
}
```

---

### 3.3 Live Channel Page - Core Component

**Location**: `client/src/pages/Channel.tsx`

**Implementation**:
```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';
import { trpc } from '../lib/trpc';
import { isAuthenticated } from '../lib/auth';

interface ChannelConfig {
  appId: string;
  token: string;
  channelName: string;
}

export default function Channel() {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();

  // Agora state
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Map<number, IAgoraRTCRemoteUser>>(new Map());
  
  // UI state
  const [joined, setJoined] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Join channel mutation
  const joinMutation = trpc.channel.join.useMutation({
    onSuccess: async (data) => {
      await initializeAgora({
        appId: data.appId,
        token: data.token,
        channelName: data.channel.id.toString(),
      });
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Leave channel mutation
  const leaveMutation = trpc.channel.leave.useMutation({
    onSuccess: () => {
      navigate('/channels');
    },
  });

  // Initialize Agora client
  const initializeAgora = async (config: ChannelConfig) => {
    try {
      // Create client
      const agoraClient = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8',
      });

      // Event: Remote user published
      agoraClient.on('user-published', async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUsers((prev) => new Map(prev).set(user.uid as number, user));
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      // Event: Remote user unpublished
      agoraClient.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(user.uid as number);
            return newMap;
          });
        }
      });

      // Event: Remote user left
      agoraClient.on('user-left', (user) => {
        setRemoteUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(user.uid as number);
          return newMap;
        });
      });

      // Join channel
      await agoraClient.join(
        config.appId,
        config.channelName,
        config.token,
        null
      );

      // Create and publish local tracks
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      await agoraClient.publish([videoTrack, audioTrack]);

      setClient(agoraClient);
      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);
      setJoined(true);

      // Play local video
      videoTrack.play('local-player');
    } catch (err: any) {
      console.error('Failed to initialize Agora:', err);
      setError(err.message || 'Failed to join channel');
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
      localVideoTrack?.close();
      localAudioTrack?.close();
      client?.leave();
    };
  }, [client, localVideoTrack, localAudioTrack]);

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
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!videoMuted);
      setVideoMuted(!videoMuted);
    }
  };

  // Leave channel
  const handleLeave = async () => {
    if (channelId) {
      leaveMutation.mutate({ channelId: Number(channelId) });
    }
    
    localVideoTrack?.close();
    localAudioTrack?.close();
    await client?.leave();
    navigate('/channels');
  };

  if (error) {
    return (
      <div className="channel-error">
        <div className="error-message">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/channels')}>
          Back to Channels
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="channel-loading">
        <div className="loading">Joining channel...</div>
      </div>
    );
  }

  return (
    <div className="channel-page">
      <div className="channel-header">
        <h2>Live Channel</h2>
        <button className="btn btn-secondary" onClick={handleLeave}>
          Leave Channel
        </button>
      </div>

      <div className="video-grid">
        {/* Local video */}
        <div className="video-container local">
          <div id="local-player" className="video-player"></div>
          <div className="video-label">You</div>
        </div>

        {/* Remote videos */}
        {Array.from(remoteUsers.entries()).map(([uid, user]) => (
          <div key={uid} className="video-container remote">
            <div id={`remote-player-${uid}`} className="video-player"></div>
            <div className="video-label">User {uid}</div>
          </div>
        ))}
      </div>

      <div className="channel-controls">
        <button
          className={`btn-control ${audioMuted ? 'muted' : ''}`}
          onClick={toggleAudio}
          title={audioMuted ? 'Unmute' : 'Mute'}
        >
          {audioMuted ? '🔇' : '🎤'}
        </button>

        <button
          className={`btn-control ${videoMuted ? 'muted' : ''}`}
          onClick={toggleVideo}
          title={videoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {videoMuted ? '📹' : '📷'}
        </button>

        <button
          className="btn-control leave"
          onClick={handleLeave}
          title="Leave channel"
        >
          📞
        </button>
      </div>
    </div>
  );
}
```

---

### 3.4 Update Routes

**Location**: `client/src/App.tsx`

**Add Routes**:
```typescript
import Channels from './pages/Channels';
import CreateChannel from './pages/CreateChannel';
import Channel from './pages/Channel';

// In Routes component:
<Route path="/channels" element={<Channels />} />
<Route path="/create-channel" element={<CreateChannel />} />
<Route path="/channel/:channelId" element={<Channel />} />
```

---

### 3.5 Add Navigation Links

**Update Dashboard** (`client/src/pages/Dashboard.tsx`):
```typescript
// Add link to channels
<button 
  className="btn btn-primary" 
  onClick={() => navigate('/channels')}
>
  Browse Live Channels
</button>
```

**Update Landing** (`client/src/pages/Landing.tsx`):
```typescript
// Add to navigation or hero section
<button onClick={() => navigate('/channels')}>
  Live Channels
</button>
```

---

### 3.6 Styling

**Add to** `client/src/index.css`:
```css
/* Channels page */
.channels-container {
  min-height: 100vh;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.channels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  color: white;
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.channel-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channel-info h3 {
  margin: 0;
  font-size: 20px;
  color: #1a202c;
}

.channel-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #718096;
  margin-top: 8px;
}

.badge-private {
  background: #fed7d7;
  color: #c53030;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

/* Channel page */
.channel-page {
  min-height: 100vh;
  background: #1a202c;
  display: flex;
  flex-direction: column;
}

.channel-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2d3748;
  color: white;
}

.video-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px;
}

.video-container {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.video-container.local {
  border: 3px solid #667eea;
}

.video-player {
  width: 100%;
  height: 100%;
}

.video-label {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.channel-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px;
  background: #2d3748;
}

.btn-control {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: #4a5568;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-control:hover {
  background: #667eea;
  transform: scale(1.1);
}

.btn-control.muted {
  background: #e53e3e;
}

.btn-control.leave {
  background: #e53e3e;
}

.btn-control.leave:hover {
  background: #c53030;
}

.channel-loading,
.channel-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}
```

---

## Testing Checklist

- [ ] Channels list page loads and displays active channels
- [ ] Create channel page validates inputs
- [ ] Successfully create a channel and redirect to live view
- [ ] Local video/audio streams appear
- [ ] Can join existing channel as second user
- [ ] Remote video/audio appears for other participants
- [ ] Audio mute/unmute works
- [ ] Video mute/unmute works
- [ ] Leave channel works and cleans up resources
- [ ] Full channel shows "Full" and disables join button
- [ ] Private channels show badge
- [ ] Navigation between pages works
- [ ] Responsive design works on different screen sizes

---

## Success Criteria

- ✅ Users can browse active channels
- ✅ Users can create new channels
- ✅ Real-time video/audio streaming works
- ✅ Multiple participants can join same channel
- ✅ Controls for audio/video work
- ✅ UI is responsive and intuitive
- ✅ No memory leaks (cleanup on unmount)

---

## Next Phase

➡️ **Phase 4**: Polish & Features - Screen sharing, chat, recording, etc.

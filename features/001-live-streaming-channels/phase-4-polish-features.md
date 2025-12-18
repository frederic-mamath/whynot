# Phase 4: Polish & Additional Features

**Status**: To Do  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 3 completed

---

## Objectives

- Add screen sharing capability
- Implement participant list sidebar
- Add channel settings and moderation
- Improve error handling and user feedback
- Add loading states and animations
- Optimize performance

---

## Tasks

### 4.1 Screen Sharing Feature

**Update Channel Component** (`client/src/pages/Channel.tsx`):

```typescript
// Add state
const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
const [isScreenSharing, setIsScreenSharing] = useState(false);

// Screen sharing function
const toggleScreenShare = async () => {
  if (!client) return;

  try {
    if (!isScreenSharing) {
      // Start screen sharing
      const screenVideoTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: '1080p_1',
      });

      // Unpublish camera
      if (localVideoTrack) {
        await client.unpublish([localVideoTrack]);
        localVideoTrack.close();
      }

      // Publish screen
      await client.publish([screenVideoTrack]);
      setScreenTrack(screenVideoTrack as any);
      setIsScreenSharing(true);

      // Play screen share locally
      screenVideoTrack.play('local-player');

      // Listen for screen share stop (user clicks browser's stop button)
      screenVideoTrack.on('track-ended', () => {
        stopScreenShare();
      });
    } else {
      // Stop screen sharing
      await stopScreenShare();
    }
  } catch (err: any) {
    console.error('Screen share error:', err);
    setError('Failed to share screen: ' + err.message);
  }
};

const stopScreenShare = async () => {
  if (!client || !screenTrack) return;

  // Unpublish and close screen track
  await client.unpublish([screenTrack]);
  screenTrack.close();
  setScreenTrack(null);
  setIsScreenSharing(false);

  // Re-publish camera
  const videoTrack = await AgoraRTC.createCameraVideoTrack();
  await client.publish([videoTrack]);
  setLocalVideoTrack(videoTrack);
  videoTrack.play('local-player');
};

// Add button to controls
<button
  className="btn-control"
  onClick={toggleScreenShare}
  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
>
  {isScreenSharing ? '🛑' : '🖥️'}
</button>
```

---

### 4.2 Participant List Sidebar

**Create Component** (`client/src/components/ParticipantList.tsx`):

```typescript
interface Participant {
  uid: number;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  localUid: number;
}

export default function ParticipantList({ participants, localUid }: ParticipantListProps) {
  return (
    <div className="participant-list">
      <h3>Participants ({participants.length})</h3>
      <div className="participant-items">
        {participants.map((p) => (
          <div key={p.uid} className="participant-item">
            <div className="participant-avatar">
              {p.uid === localUid ? '👤' : '👥'}
            </div>
            <div className="participant-info">
              <span className="participant-name">
                {p.uid === localUid ? 'You' : `User ${p.uid}`}
              </span>
              <div className="participant-status">
                {p.hasAudio ? '🎤' : '🔇'}
                {p.hasVideo ? '📷' : '📹'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Update Channel Component**:
```typescript
import ParticipantList from '../components/ParticipantList';

// Track participants
const [participants, setParticipants] = useState<Participant[]>([]);

// Update when users join/leave
useEffect(() => {
  const participantList: Participant[] = [
    {
      uid: localUid,
      hasVideo: !videoMuted,
      hasAudio: !audioMuted,
    },
    ...Array.from(remoteUsers.values()).map((user) => ({
      uid: user.uid as number,
      hasVideo: user.hasVideo,
      hasAudio: user.hasAudio,
    })),
  ];
  setParticipants(participantList);
}, [remoteUsers, audioMuted, videoMuted]);

// In JSX
<ParticipantList participants={participants} localUid={localUid} />
```

---

### 4.3 Channel Settings Panel

**Create Component** (`client/src/components/ChannelSettings.tsx`):

```typescript
interface ChannelSettingsProps {
  channelId: number;
  isHost: boolean;
  onClose: () => void;
}

export default function ChannelSettings({ channelId, isHost, onClose }: ChannelSettingsProps) {
  const endChannelMutation = trpc.channel.end.useMutation({
    onSuccess: () => {
      window.location.href = '/channels';
    },
  });

  const handleEndChannel = () => {
    if (confirm('Are you sure you want to end this channel?')) {
      endChannelMutation.mutate({ channelId });
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Channel Settings</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="settings-content">
        {isHost && (
          <div className="settings-section">
            <h4>Host Controls</h4>
            <button
              className="btn btn-danger"
              onClick={handleEndChannel}
              disabled={endChannelMutation.isLoading}
            >
              {endChannelMutation.isLoading ? 'Ending...' : 'End Channel'}
            </button>
          </div>
        )}

        <div className="settings-section">
          <h4>Audio Settings</h4>
          {/* Add audio device selector here */}
        </div>

        <div className="settings-section">
          <h4>Video Settings</h4>
          {/* Add video device selector here */}
        </div>
      </div>
    </div>
  );
}
```

---

### 4.4 Network Quality Indicator

**Add to Channel Component**:

```typescript
const [networkQuality, setNetworkQuality] = useState<{
  uplink: number;
  downlink: number;
}>({ uplink: 0, downlink: 0 });

// Listen to network quality
useEffect(() => {
  if (!client) return;

  const handleNetworkQuality = (stats: any) => {
    setNetworkQuality({
      uplink: stats.uplinkNetworkQuality,
      downlink: stats.downlinkNetworkQuality,
    });
  };

  client.on('network-quality', handleNetworkQuality);

  return () => {
    client.off('network-quality', handleNetworkQuality);
  };
}, [client]);

// Display network quality
const getNetworkQualityIcon = (quality: number) => {
  if (quality <= 2) return '📶'; // Excellent
  if (quality <= 4) return '📶'; // Good
  return '📵'; // Poor
};

// In JSX
<div className="network-indicator">
  {getNetworkQualityIcon(networkQuality.uplink)}
</div>
```

---

### 4.5 Toast Notifications

**Create Utility** (`client/src/lib/toast.ts`):

```typescript
export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
```

**Usage in Channel Component**:
```typescript
import { showToast } from '../lib/toast';

// When user joins
agoraClient.on('user-joined', (user) => {
  showToast(`User ${user.uid} joined`, 'info');
});

// When user leaves
agoraClient.on('user-left', (user) => {
  showToast(`User ${user.uid} left`, 'info');
});
```

---

### 4.6 Loading States & Skeletons

**Create Loading Component** (`client/src/components/ChannelSkeleton.tsx`):

```typescript
export default function ChannelSkeleton() {
  return (
    <div className="channels-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="channel-card skeleton">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-button"></div>
        </div>
      ))}
    </div>
  );
}
```

**Use in Channels Page**:
```typescript
import ChannelSkeleton from '../components/ChannelSkeleton';

if (isLoading) {
  return <ChannelSkeleton />;
}
```

---

### 4.7 Error Boundary

**Create Component** (`client/src/components/ErrorBoundary.tsx`):

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.href = '/channels'}>
            Back to Channels
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap Channel Route**:
```typescript
<Route 
  path="/channel/:channelId" 
  element={
    <ErrorBoundary>
      <Channel />
    </ErrorBoundary>
  } 
/>
```

---

### 4.8 Performance Optimizations

**Lazy Load Pages**:
```typescript
// In App.tsx
import { lazy, Suspense } from 'react';

const Channels = lazy(() => import('./pages/Channels'));
const Channel = lazy(() => import('./pages/Channel'));
const CreateChannel = lazy(() => import('./pages/CreateChannel'));

// Wrap routes
<Suspense fallback={<div className="loading">Loading...</div>}>
  <Routes>
    {/* ... routes ... */}
  </Routes>
</Suspense>
```

**Memoize Components**:
```typescript
import { memo } from 'react';

export default memo(ParticipantList);
```

**Debounce Network Quality Updates**:
```typescript
import { debounce } from 'lodash'; // or create custom debounce

const debouncedNetworkUpdate = debounce((stats) => {
  setNetworkQuality({
    uplink: stats.uplinkNetworkQuality,
    downlink: stats.downlinkNetworkQuality,
  });
}, 1000);
```

---

### 4.9 Additional CSS

```css
/* Participant list */
.participant-list {
  background: #2d3748;
  padding: 20px;
  border-radius: 12px;
  color: white;
  max-height: 400px;
  overflow-y: auto;
}

.participant-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #4a5568;
  border-radius: 8px;
}

.participant-avatar {
  font-size: 24px;
}

.participant-info {
  flex: 1;
}

.participant-status {
  font-size: 14px;
  margin-top: 4px;
}

/* Settings panel */
.settings-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: white;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.settings-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 24px;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background: #c53030;
}

/* Toast notifications */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s;
  z-index: 2000;
}

.toast-show {
  opacity: 1;
  transform: translateY(0);
}

.toast-success {
  background: #48bb78;
}

.toast-error {
  background: #e53e3e;
}

.toast-info {
  background: #4299e1;
}

/* Skeleton loading */
.skeleton {
  animation: skeleton-loading 1s infinite alternate;
}

@keyframes skeleton-loading {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

.skeleton-title {
  height: 24px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-text {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 16px;
  width: 60%;
}

.skeleton-button {
  height: 40px;
  background: #e2e8f0;
  border-radius: 8px;
}

/* Network indicator */
.network-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 20px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 10px;
  border-radius: 6px;
}

/* Error boundary */
.error-boundary {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}
```

---

## Testing Checklist

- [ ] Screen sharing starts and stops correctly
- [ ] Participant list updates in real-time
- [ ] Settings panel opens and closes
- [ ] Host can end channel
- [ ] Network quality indicator updates
- [ ] Toast notifications appear and disappear
- [ ] Loading skeletons show while data loads
- [ ] Error boundary catches errors gracefully
- [ ] Lazy loading works for pages
- [ ] Performance is smooth with multiple participants
- [ ] UI is responsive on mobile devices

---

## Success Criteria

- ✅ Screen sharing works without issues
- ✅ Participant list accurate and updates in real-time
- ✅ Host controls functional
- ✅ Network quality visible to users
- ✅ User feedback through toast notifications
- ✅ Smooth loading states
- ✅ Graceful error handling
- ✅ Good performance with 5+ participants

---

## Optional Enhancements (Future)

- 💬 Text chat alongside video
- 📝 Channel recording
- 🎨 Virtual backgrounds
- 🔊 Noise cancellation
- 📊 Real-time analytics
- 🎭 Reactions and emojis
- 👋 Hand raise feature
- 📱 Mobile app support

---

## Next Steps

After completing all phases, the live streaming feature will be production-ready. Consider:
- Load testing with multiple concurrent channels
- Security audit of token generation
- Analytics integration
- User feedback collection
- Documentation updates

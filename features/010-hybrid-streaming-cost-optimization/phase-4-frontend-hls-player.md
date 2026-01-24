# Phase 4: Frontend HLS Player for Buyers

## Objective

Create HLS video player component for buyers to watch live streams via CDN instead of Agora, reducing per-viewer costs.

## User-Facing Changes

**For Buyers**:

- New HLS-based video player (replaces Agora for buyers)
- Latency indicator badge showing ~15-30s delay
- Quality selector (auto, 1080p, 720p, 480p)
- Standard video controls (play/pause, volume, fullscreen)
- Loading and buffering states
- Better mobile support (native HLS on iOS)

**For Sellers**:

- No changes (still use Agora)

---

## Files to Update

### New Files

- `client/src/components/ui/HLSVideoPlayer/HLSVideoPlayer.tsx` - Main HLS player component
- `client/src/components/ui/HLSVideoPlayer/index.ts` - Export
- `client/src/hooks/useHLSPlayer.ts` - HLS.js integration hook
- `client/src/hooks/useStreamQuality.ts` - Quality selection logic

### Modified Files

- `client/src/pages/LiveChannelPage.tsx` - Use HLS player for buyers, Agora for sellers
- `client/src/components/LiveChannel/LiveChannel.tsx` - Conditional rendering based on role
- `client/src/types/channel.ts` - Add HLS URL field

---

## Steps

### 1. Install HLS.js

```bash
cd client
npm install hls.js
npm install --save-dev @types/hls.js
```

---

### 2. Create HLS Player Hook

**File**: `client/src/hooks/useHLSPlayer.ts`

```typescript
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface UseHLSPlayerProps {
  src: string; // HLS URL
  autoplay?: boolean;
}

interface UseHLSPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  isBuffering: boolean;
  error: Error | null;
  play: () => Promise<void>;
  pause: () => void;
  setQuality: (level: number) => void;
  availableQualities: Array<{ level: number; height: number; bitrate: number }>;
}

export function useHLSPlayer({
  src,
  autoplay = true,
}: UseHLSPlayerProps): UseHLSPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [availableQualities, setAvailableQualities] = useState<
    Array<{ level: number; height: number; bitrate: number }>
  >([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Standard HLS (set true for LL-HLS)
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      // Attach media
      hls.attachMedia(video);

      // Load source
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });

      // Manifest parsed (qualities available)
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualities = data.levels.map((level, index) => ({
          level: index,
          height: level.height,
          bitrate: level.bitrate,
        }));
        setAvailableQualities(qualities);

        if (autoplay) {
          video.play().catch((err) => {
            console.error("Autoplay failed:", err);
            setError(err);
          });
        }
      });

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Network error, attempting recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Media error, attempting recovery...");
              hls.recoverMediaError();
              break;
            default:
              setError(new Error(`Fatal error: ${data.type}`));
              hls.destroy();
              break;
          }
        }
      });

      // Buffering events
      hls.on(Hls.Events.BUFFER_APPENDING, () => setIsBuffering(true));
      hls.on(Hls.Events.BUFFER_APPENDED, () => setIsBuffering(false));

      return () => {
        hls.destroy();
      };
    }
    // Safari supports HLS natively
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;

      if (autoplay) {
        video.play().catch((err) => setError(err));
      }
    }
    // HLS not supported
    else {
      setError(new Error("HLS is not supported in this browser"));
    }

    // Video event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, [src, autoplay]);

  const play = async () => {
    if (videoRef.current) {
      await videoRef.current.play();
    }
  };

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const setQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
    }
  };

  return {
    videoRef,
    isPlaying,
    isBuffering,
    error,
    play,
    pause,
    setQuality,
    availableQualities,
  };
}
```

---

### 3. Create HLS Video Player Component

**File**: `client/src/components/ui/HLSVideoPlayer/HLSVideoPlayer.tsx`

```typescript
import { useState } from 'react';
import { useHLSPlayer } from '@/hooks/useHLSPlayer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Loader2,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface HLSVideoPlayerProps {
  src: string;
  className?: string;
  autoplay?: boolean;
  showLatencyBadge?: boolean;
}

export function HLSVideoPlayer({
  src,
  className,
  autoplay = true,
  showLatencyBadge = true
}: HLSVideoPlayerProps) {
  const {
    videoRef,
    isPlaying,
    isBuffering,
    error,
    play,
    pause,
    setQuality,
    availableQualities
  } = useHLSPlayer({ src, autoplay });

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const getQualityLabel = (height: number) => {
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    return `${height}p`;
  };

  if (error) {
    return (
      <div className={cn('relative bg-black rounded-lg flex items-center justify-center', className)}>
        <div className="text-center text-white p-8">
          <p className="text-lg font-semibold mb-2">Failed to load stream</p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative bg-black rounded-lg overflow-hidden group', className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(isPlaying ? false : true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={isMuted}
      />

      {/* Latency Badge */}
      {showLatencyBadge && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
          ~15-30s delay
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlay}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Quality Selector */}
          {availableQualities.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setQuality(-1)}>
                  Auto
                </DropdownMenuItem>
                {availableQualities.map(({ level, height }) => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => setQuality(level)}
                  >
                    {getQualityLabel(height)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**File**: `client/src/components/ui/HLSVideoPlayer/index.ts`

```typescript
export { HLSVideoPlayer } from "./HLSVideoPlayer";
```

---

### 4. Update Live Channel Page

**File**: `client/src/pages/LiveChannelPage.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { HLSVideoPlayer } from '@/components/ui/HLSVideoPlayer';
import { AgoraVideoPlayer } from '@/components/ui/AgoraVideoPlayer'; // Existing
import { Loader2 } from 'lucide-react';

export function LiveChannelPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const { user } = useAuth();

  const { data: channel, isLoading } = trpc.channel.getById.useQuery({
    id: parseInt(channelId!)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!channel) {
    return <div>Channel not found</div>;
  }

  // Determine if user is the seller (host)
  const isSeller = user?.id === channel.hostUserId;

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2">
          {isSeller ? (
            // Seller uses Agora (low latency)
            <AgoraVideoPlayer
              channelName={`channel_${channel.id}`}
              uid={user!.id}
              role="host"
              className="aspect-video"
            />
          ) : (
            // Buyer uses HLS (cost-effective)
            channel.hlsPlaybackUrl ? (
              <HLSVideoPlayer
                src={channel.hlsPlaybackUrl}
                className="aspect-video"
                showLatencyBadge={true}
              />
            ) : (
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                <p>Stream starting soon...</p>
              </div>
            )
          )}

          {/* Channel Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold">{channel.title}</h1>
            <p className="text-muted-foreground">{channel.description}</p>
          </div>
        </div>

        {/* Sidebar (Chat, Products, etc.) */}
        <div className="lg:col-span-1">
          {/* Existing sidebar content */}
        </div>
      </div>
    </div>
  );
}
```

---

### 5. Update Channel Types

**File**: `client/src/types/channel.ts`

```typescript
export interface Channel {
  id: number;
  title: string;
  description: string;
  hostUserId: number;
  isActive: boolean;

  // Hybrid streaming fields
  streamMode: "agora-only" | "hybrid" | "hls-only";
  hlsPlaybackUrl: string | null;
  relayStatus: "starting" | "active" | "stopped" | "error" | null;

  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
}
```

---

## Design Considerations

### 1. Browser Compatibility

- **HLS.js**: Works on Chrome, Firefox, Edge (not natively supported)
- **Native HLS**: Works on Safari (iOS/macOS)
- **Fallback**: Show error message on unsupported browsers (very rare)

### 2. Mobile Optimization

- Use `playsInline` attribute (prevents fullscreen on iOS)
- Touch-friendly controls (larger tap targets)
- Native HLS playback on iOS (battery efficient)
- Adaptive bitrate based on network

### 3. Latency Communication

- Always show latency badge for buyers (set expectations)
- Consider showing "LIVE" badge for sellers (Agora)
- Future: Add "catch up to live" button

### 4. Quality Selection

- Default to "Auto" (HLS adaptive bitrate)
- Allow manual selection for users with good connection
- Persist quality preference in localStorage

---

## Acceptance Criteria

- [ ] HLS player loads and plays HLS streams
- [ ] Play/pause controls work
- [ ] Volume control works
- [ ] Fullscreen works (desktop + mobile)
- [ ] Quality selector shows available resolutions
- [ ] Quality switching works without rebuffering
- [ ] Latency badge displays correctly
- [ ] Buffering indicator shows during loading
- [ ] Error handling displays user-friendly messages
- [ ] Works on Safari (native HLS)
- [ ] Works on Chrome/Firefox (HLS.js)
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] Buyers see HLS player, sellers see Agora player

---

## Testing Checklist

### Functional Testing

- [ ] Load HLS stream from Cloudflare/AWS IVS
- [ ] Play/pause video
- [ ] Adjust volume (0% to 100%)
- [ ] Mute/unmute
- [ ] Enter/exit fullscreen
- [ ] Switch quality levels
- [ ] Handle stream start (loading state)
- [ ] Handle stream end (ended state)
- [ ] Handle network errors (show error message)

### Browser Testing

- [ ] Chrome (Windows, macOS)
- [ ] Firefox (Windows, macOS)
- [ ] Safari (macOS, iOS)
- [ ] Edge (Windows)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### Performance Testing

- [ ] CPU usage acceptable (<30% on average laptop)
- [ ] Memory stable (no leaks after 30 min playback)
- [ ] Smooth playback on 10 Mbps connection
- [ ] Graceful degradation on slow connection (auto quality adjust)

### UX Testing

- [ ] Controls visible on hover (desktop)
- [ ] Controls always visible on mobile
- [ ] Latency badge not intrusive
- [ ] Error messages clear and actionable
- [ ] Loading state informative

---

## Status

📝 PLANNING

## Notes

### HLS.js Configuration

- **lowLatencyMode**: Set to `true` if using LL-HLS (Cloudflare, AWS IVS)
- **backBufferLength**: How much old video to keep in memory
- **maxBufferLength**: Max buffer ahead (impacts latency)

### Future Enhancements

- DVR/rewind functionality (seek back in live stream)
- Picture-in-picture mode
- Keyboard shortcuts (space = play/pause, M = mute, F = fullscreen)
- Playback speed control (probably not useful for live)
- Stats for nerds (bitrate, resolution, dropped frames)

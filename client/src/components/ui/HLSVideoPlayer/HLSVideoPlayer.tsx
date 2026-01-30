import { useState } from "react";
import { useHLSPlayer } from "@/hooks/useHLSPlayer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";

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
  showLatencyBadge = true,
}: HLSVideoPlayerProps) {
  const {
    videoRef,
    isPlaying,
    isBuffering,
    error,
    play,
    pause,
    setQuality,
    availableQualities,
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
      setIsMuted(newVolume === 0);
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
    if (height >= 1080) return "1080p";
    if (height >= 720) return "720p";
    if (height >= 480) return "480p";
    return `${height}p`;
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const level = parseInt(e.target.value);
    setQuality(level);
  };

  if (error) {
    return (
      <div
        className={cn(
          "relative bg-black rounded-lg flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center text-white p-8">
          <p className="text-lg font-semibold mb-2">Failed to load stream</p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className,
      )}
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
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
          showControls ? "opacity-100" : "opacity-0",
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
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
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
            <select
              onChange={handleQualityChange}
              className="bg-white/20 text-white text-sm px-2 py-1 rounded hover:bg-white/30 cursor-pointer border-0 outline-none"
              defaultValue="-1"
            >
              <option value="-1">Auto</option>
              {availableQualities.map(({ level, height }) => (
                <option key={level} value={level} className="bg-black">
                  {getQualityLabel(height)}
                </option>
              ))}
            </select>
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

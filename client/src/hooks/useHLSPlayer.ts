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

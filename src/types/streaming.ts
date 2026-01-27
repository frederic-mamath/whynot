// Cloudflare Stream API Types
export interface CloudflareStreamCredentials {
  streamKeyId: string; // Cloudflare Live Input UID
  rtmpUrl: string; // URL for RTMP push (Agora → Cloudflare)
  rtmpsUrl: string; // Secure RTMP URL (recommended)
  hlsPlaybackUrl: string; // HLS URL for buyers
  dashPlaybackUrl?: string; // Optional DASH URL
}

export interface CloudflareStreamStatus {
  isLive: boolean;
  viewerCount?: number; // Not available in real-time from Cloudflare
  durationSeconds: number;
  recordingAvailable: boolean;
}

export interface CreateStreamOptions {
  channelId: number;
  enableRecording?: boolean; // Save VOD after stream ends
  maxDurationSeconds?: number; // Auto-stop after duration
  deleteRecordingAfterDays?: number; // Auto-cleanup old VODs
}

// Generic streaming platform interface (for future multi-provider support)
export interface StreamingPlatformCredentials {
  streamKey: string;
  rtmpPushUrl: string;
  playbackUrl: string;
  streamId: string;
}

export interface StreamAnalytics {
  viewerCount: number;
  currentBitrate: number;
  peakViewers: number;
  totalWatchTime: number;
}

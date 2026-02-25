// src/types/index.ts

export interface StreamJob {
  jobId: string;
  channelId: number;
  rtmpUrl: string;
  agoraToken: string;
  agoraChannel: string;
  streamConfig: StreamConfig;
  createdAt: Date;
}

export interface StreamConfig {
  videoCodec: "h264" | "h265";
  videoBitrate: number; // kbps
  videoResolution: "1080p" | "720p" | "480p";
  audioCodec: "aac" | "opus";
  audioBitrate: number; // kbps
  framerate: number;
}

export interface FFmpegProcessInfo {
  pid: number;
  channelId: number;
  startedAt: Date;
  status: "starting" | "running" | "stopping" | "error";
  errorCount: number;
  lastError?: string;
}

export interface WorkerHealth {
  status: "healthy" | "degraded" | "unhealthy";
  activeStreams: number;
  maxStreams: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  lastCheck: Date;
}

export interface WorkerStats {
  activeStreams: number;
  maxStreams: number;
  utilization: number;
  streams: FFmpegProcessInfo[];
}

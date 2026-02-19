// src/config/index.ts
import dotenv from "dotenv";

dotenv.config();

export const config = {
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    queueName: "ffmpeg-stream-jobs",
  },

  ffmpeg: {
    maxConcurrentStreams: parseInt(process.env.MAX_CONCURRENT_STREAMS || "10"),
    logLevel: process.env.FFMPEG_LOG_LEVEL || "warning",
    defaultConfig: {
      videoCodec: "h264",
      videoBitrate: 2500, // kbps
      videoResolution: "720p",
      audioCodec: "aac",
      audioBitrate: 128, // kbps
      framerate: 30,
    },
  },

  server: {
    port: parseInt(process.env.PORT || "3001"),
    healthCheckInterval: 30000, // 30 seconds
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
} as const;

// Validate required env vars
if (!config.redis.url) {
  throw new Error("REDIS_URL environment variable is required");
}

console.log("✅ Configuration loaded:", {
  redisUrl: config.redis.url,
  maxStreams: config.ffmpeg.maxConcurrentStreams,
  serverPort: config.server.port,
});

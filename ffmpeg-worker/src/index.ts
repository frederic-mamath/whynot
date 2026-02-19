// src/index.ts
import express from "express";
import { FFmpegManager } from "./services/FFmpegManager";
import { StreamService } from "./services/StreamService";
import { RedisConsumer } from "./utils/redisConsumer";
import { HealthController } from "./controllers/healthController";
import { config } from "./config";

async function main() {
  console.log("🚀 Starting WhyNot FFmpeg Worker...");
  console.log("Configuration:", {
    redisUrl: config.redis.url,
    maxStreams: config.ffmpeg.maxConcurrentStreams,
    serverPort: config.server.port,
  });

  // Initialize services
  const ffmpegManager = new FFmpegManager();
  const streamService = new StreamService(ffmpegManager);

  // Initialize Redis consumer
  const redisConsumer = new RedisConsumer(streamService);

  // Initialize HTTP server
  const app = express();
  const healthController = new HealthController(streamService);

  // Serve static files (for RTC subscriber page)
  app.use(express.static("public"));

  // Mount routes
  app.use("/", healthController.router);

  // Start HTTP server
  app.listen(config.server.port, () => {
    console.log(`✅ HTTP server running on port ${config.server.port}`);
    console.log(
      `📡 Health check: http://localhost:${config.server.port}/health`,
    );
  });

  console.log("✅ FFmpeg Worker ready and waiting for jobs");

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("🔚 Received SIGTERM, shutting down...");
    await redisConsumer.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

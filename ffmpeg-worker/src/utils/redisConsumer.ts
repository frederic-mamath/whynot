// src/utils/redisConsumer.ts
import { Worker, Job } from "bullmq";
import { StreamJob } from "../types";
import { config } from "../config";
import { StreamService } from "../services/StreamService";

/**
 * RedisConsumer Utility
 * Handles communication with Redis queue
 */
export class RedisConsumer {
  private worker: Worker<StreamJob>;
  private streamService: StreamService;

  constructor(streamService: StreamService) {
    this.streamService = streamService;

    // Detect TLS from redis URL
    const isTLS = config.redis.url.startsWith("rediss://");

    this.worker = new Worker<StreamJob>(
      config.redis.queueName,
      async (job: Job<StreamJob>) => {
        return this.processJob(job);
      },
      {
        connection: {
          host: this.getRedisHost(),
          port: this.getRedisPort(),
          username: this.getRedisUsername(),
          password: this.getRedisPassword(),
          ...(isTLS && {
            tls: {
              rejectUnauthorized: false,
            },
          }),
        },
        concurrency: config.ffmpeg.maxConcurrentStreams,
        limiter: {
          max: config.ffmpeg.maxConcurrentStreams,
          duration: 1000,
        },
      },
    );

    this.setupEventHandlers();
    console.log("✅ Redis consumer initialized");
  }

  /**
   * Process a stream job
   */
  private async processJob(job: Job<StreamJob>): Promise<void> {
    const { channelId } = job.data;

    console.log(`📥 Processing job ${job.id} for channel ${channelId}`);

    try {
      await this.streamService.startStream(job.data);
      console.log(`✅ Job ${job.id} started successfully`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error; // BullMQ will retry based on settings
    }
  }

  /**
   * Setup worker event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on("completed", (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    this.worker.on("failed", (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error);
    });

    this.worker.on("error", (error) => {
      console.error("❌ Worker error:", error);
    });

    this.worker.on("active", (job) => {
      console.log(`⚙️  Job ${job.id} is now active`);
    });
  }

  /**
   * Parse Redis URL for host
   */
  private getRedisHost(): string {
    const url = new URL(config.redis.url);
    return url.hostname || "localhost";
  }

  /**
   * Parse Redis URL for port
   */
  private getRedisPort(): number {
    const url = new URL(config.redis.url);
    return parseInt(url.port) || 6379;
  }

  /**
   * Parse Redis URL for username
   */
  private getRedisUsername(): string | undefined {
    const url = new URL(config.redis.url);
    return url.username || undefined;
  }

  /**
   * Parse Redis URL for password
   */
  private getRedisPassword(): string | undefined {
    const url = new URL(config.redis.url);
    return url.password || undefined;
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    console.log("🔚 Closing Redis consumer...");
    await this.worker.close();
    console.log("✅ Redis consumer closed");
  }
}

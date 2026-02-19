import { Queue, QueueEvents } from "bullmq";

/**
 * FFmpeg Queue Service
 * Manages Redis queue for FFmpeg worker jobs
 */

interface StreamJob {
  jobId: string;
  channelId: number;
  rtmpUrl: string;
  agoraToken: string;
  agoraChannel: string;
  streamConfig: {
    videoCodec: "h264" | "h265";
    videoBitrate: number; // kbps
    videoResolution: "1080p" | "720p" | "480p";
    audioCodec: "aac" | "opus";
    audioBitrate: number; // kbps
    framerate: number;
  };
  createdAt: Date;
}

export class FFmpegQueueService {
  private queue: Queue;
  private queueEvents: QueueEvents;
  private redisUrl: string;

  constructor() {
    this.redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    // Create BullMQ queue with Redis connection URL
    this.queue = new Queue("ffmpeg-stream-jobs", {
      connection: {
        url: this.redisUrl,
        maxRetriesPerRequest: null,
      },
    });

    // Setup queue event listeners
    this.queueEvents = new QueueEvents("ffmpeg-stream-jobs", {
      connection: {
        url: this.redisUrl,
        maxRetriesPerRequest: null,
      },
    });

    this.setupEventHandlers();
    console.log("✅ FFmpegQueueService initialized");
  }

  /**
   * Setup queue event handlers
   */
  private setupEventHandlers(): void {
    this.queueEvents.on("completed", ({ jobId }: { jobId: string }) => {
      console.log(`✅ FFmpeg job ${jobId} completed`);
    });

    this.queueEvents.on(
      "failed",
      ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
        console.error(`❌ FFmpeg job ${jobId} failed: ${failedReason}`);
      },
    );

    this.queueEvents.on("active", ({ jobId }: { jobId: string }) => {
      console.log(`⚙️  FFmpeg job ${jobId} is now active`);
    });
  }

  /**
   * Enqueue a stream job for the FFmpeg worker
   */
  async enqueueStreamJob(params: {
    channelId: number;
    rtmpUrl: string;
    agoraChannel: string;
    agoraToken: string;
  }): Promise<string> {
    const jobId = `stream-${params.channelId}-${Date.now()}`;

    const job: StreamJob = {
      jobId,
      channelId: params.channelId,
      rtmpUrl: params.rtmpUrl,
      agoraToken: params.agoraToken,
      agoraChannel: params.agoraChannel,
      streamConfig: {
        videoCodec: "h264",
        videoBitrate: 2500, // 2.5 Mbps
        videoResolution: "720p",
        audioCodec: "aac",
        audioBitrate: 128, // 128 kbps
        framerate: 30,
      },
      createdAt: new Date(),
    };

    console.log(`📤 Enqueuing FFmpeg job for channel ${params.channelId}`);

    await this.queue.add(jobId, job, {
      jobId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    });

    console.log(`✅ Job ${jobId} enqueued successfully`);
    return jobId;
  }

  /**
   * Remove a job from the queue (when stream stops)
   */
  async removeJob(channelId: number): Promise<void> {
    // Find and remove all jobs for this channel
    const jobs = await this.queue.getJobs(["waiting", "active", "delayed"]);

    for (const job of jobs) {
      if (job.data.channelId === channelId) {
        console.log(`🗑️  Removing job ${job.id} for channel ${channelId}`);
        await job.remove();
      }
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return { status: "not_found" };
    }

    const state = await job.getState();
    return {
      id: job.id,
      status: state,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  }

  /**
   * Get all active jobs
   */
  async getActiveJobs(): Promise<any[]> {
    const jobs = await this.queue.getJobs(["active"]);
    return jobs.map((job: any) => ({
      id: job.id,
      channelId: job.data.channelId,
      createdAt: job.data.createdAt,
    }));
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    console.log("🔚 Closing FFmpeg queue service...");
    await this.queueEvents.close();
    await this.queue.close();
    console.log("✅ FFmpeg queue service closed");
  }
}

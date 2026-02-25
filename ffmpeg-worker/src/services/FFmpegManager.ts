// src/services/FFmpegManager.ts
import { spawn, ChildProcess } from "child_process";
import { StreamJob, FFmpegProcessInfo, StreamConfig } from "../types";
import { config } from "../config";

interface ProcessEntry {
  process: ChildProcess;
  info: FFmpegProcessInfo;
  retryCount: number;
}

/**
 * FFmpegManager Service
 * Manages FFmpeg child processes for stream conversion
 */
export class FFmpegManager {
  private processes = new Map<number, ProcessEntry>();
  private readonly MAX_RETRIES = 3;

  constructor() {
    console.log("📦 FFmpegManager service initialized");

    // Graceful shutdown handler
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  /**
   * Start FFmpeg process for a stream
   */
  async startStream(job: StreamJob): Promise<void> {
    const { channelId, rtmpUrl, streamConfig } = job;

    // Check if already running
    if (this.processes.has(channelId)) {
      console.warn(`⚠️  Stream ${channelId} already running`);
      return;
    }

    // Check capacity
    if (this.processes.size >= config.ffmpeg.maxConcurrentStreams) {
      throw new Error(
        `Max concurrent streams reached (${config.ffmpeg.maxConcurrentStreams})`,
      );
    }

    console.log(`🎬 Starting FFmpeg for channel ${channelId}`);

    const ffmpegArgs = this.buildFFmpegArgs(streamConfig, rtmpUrl);

    const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const processInfo: FFmpegProcessInfo = {
      pid: ffmpegProcess.pid!,
      channelId,
      startedAt: new Date(),
      status: "starting",
      errorCount: 0,
    };

    this.processes.set(channelId, {
      process: ffmpegProcess,
      info: processInfo,
      retryCount: 0,
    });

    // Setup event handlers
    this.setupProcessHandlers(channelId, ffmpegProcess);
  }

  /**
   * Build FFmpeg command arguments
   */
  private buildFFmpegArgs(
    streamConfig: StreamConfig,
    rtmpUrl: string,
  ): string[] {
    const resolution = this.getResolution(streamConfig.videoResolution);

    return [
      // Input from stdin (RTC frames will be piped)
      "-f",
      "rawvideo",
      "-pixel_format",
      "yuv420p",
      "-video_size",
      resolution,
      "-framerate",
      streamConfig.framerate.toString(),
      "-i",
      "pipe:0",

      // Video encoding
      "-c:v",
      streamConfig.videoCodec,
      "-preset",
      "veryfast",
      "-tune",
      "zerolatency",
      "-b:v",
      `${streamConfig.videoBitrate}k`,
      "-maxrate",
      `${streamConfig.videoBitrate * 1.2}k`,
      "-bufsize",
      `${streamConfig.videoBitrate * 2}k`,
      "-pix_fmt",
      "yuv420p",
      "-g",
      (streamConfig.framerate * 2).toString(), // GOP size = 2 seconds

      // Audio encoding
      "-c:a",
      streamConfig.audioCodec,
      "-b:a",
      `${streamConfig.audioBitrate}k`,
      "-ar",
      "48000",
      "-ac",
      "2",

      // Output format
      "-f",
      "flv",

      // Logging
      "-loglevel",
      config.ffmpeg.logLevel,

      // Output URL
      rtmpUrl,
    ];
  }

  /**
   * Get resolution dimensions
   */
  private getResolution(res: string): string {
    const resolutions: Record<string, string> = {
      "1080p": "1920x1080",
      "720p": "1280x720",
      "480p": "854x480",
    };
    return resolutions[res] || resolutions["720p"];
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(channelId: number, ffmpeg: ChildProcess): void {
    const entry = this.processes.get(channelId);
    if (!entry) return;

    ffmpeg.on("spawn", () => {
      console.log(
        `✅ FFmpeg process spawned for channel ${channelId} (PID: ${ffmpeg.pid})`,
      );
      entry.info.status = "running";
    });

    ffmpeg.on("error", (error) => {
      console.error(`❌ FFmpeg error for channel ${channelId}:`, error);
      entry.info.status = "error";
      entry.info.errorCount++;
      entry.info.lastError = error.message;

      this.handleProcessFailure(channelId, error);
    });

    ffmpeg.on("exit", (code, signal) => {
      console.log(
        `🔚 FFmpeg exited for channel ${channelId} (code: ${code}, signal: ${signal})`,
      );

      if (code !== 0 && code !== null) {
        entry.info.status = "error";
        this.handleProcessFailure(channelId, new Error(`Exit code: ${code}`));
      } else {
        this.processes.delete(channelId);
      }
    });

    // Capture stderr for debugging
    ffmpeg.stderr?.on("data", (data) => {
      const log = data.toString();
      if (log.includes("error") || log.includes("Error")) {
        console.error(`FFmpeg stderr (${channelId}):`, log);
      }
    });

    // Capture stdout
    ffmpeg.stdout?.on("data", () => {
      // Could parse FFmpeg stats here if needed
    });
  }

  /**
   * Handle process failure with retry logic
   */
  private async handleProcessFailure(
    channelId: number,
    error: Error,
  ): Promise<void> {
    const entry = this.processes.get(channelId);
    if (!entry) return;

    entry.retryCount++;

    if (entry.retryCount <= this.MAX_RETRIES) {
      console.log(
        `🔄 Retrying stream ${channelId} (attempt ${entry.retryCount}/${this.MAX_RETRIES})`,
      );

      // Clean up failed process
      this.processes.delete(channelId);

      // Wait 5 seconds before retry
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log(`⚠️  Stream ${channelId} needs manual re-enqueue`);
    } else {
      console.error(
        `💀 Stream ${channelId} failed after ${this.MAX_RETRIES} retries`,
      );
      this.processes.delete(channelId);
    }
  }

  /**
   * Stop stream for a channel
   */
  stopStream(channelId: number): void {
    const entry = this.processes.get(channelId);
    if (!entry) {
      console.warn(`⚠️  No active stream for channel ${channelId}`);
      return;
    }

    console.log(`🛑 Stopping stream for channel ${channelId}`);
    entry.info.status = "stopping";

    // Send SIGTERM for graceful shutdown
    entry.process.kill("SIGTERM");

    // Force kill after 10 seconds if not stopped
    setTimeout(() => {
      if (this.processes.has(channelId)) {
        console.warn(`⚠️  Force killing stream ${channelId}`);
        entry.process.kill("SIGKILL");
        this.processes.delete(channelId);
      }
    }, 10000);
  }

  /**
   * Get status of a specific stream
   */
  getStreamStatus(channelId: number): FFmpegProcessInfo | null {
    const entry = this.processes.get(channelId);
    return entry ? { ...entry.info } : null;
  }

  /**
   * Get all active streams
   */
  getAllStreams(): FFmpegProcessInfo[] {
    return Array.from(this.processes.values()).map((e) => ({ ...e.info }));
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      activeStreams: this.processes.size,
      maxStreams: config.ffmpeg.maxConcurrentStreams,
      utilization:
        (this.processes.size / config.ffmpeg.maxConcurrentStreams) * 100,
      streams: this.getAllStreams(),
    };
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log("🔚 Shutting down FFmpegManager...");

    const channelIds = Array.from(this.processes.keys());

    console.log(`Stopping ${channelIds.length} active streams...`);
    channelIds.forEach((id) => this.stopStream(id));

    // Wait up to 15 seconds for graceful shutdown
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Force kill any remaining
    this.processes.forEach((entry, id) => {
      console.warn(`Force killing stream ${id}`);
      entry.process.kill("SIGKILL");
    });

    this.processes.clear();
    console.log("✅ FFmpegManager shutdown complete");
    process.exit(0);
  }
}

// src/services/FFmpegManager.ts
import { spawn, ChildProcess, execSync } from "child_process";
import { StreamJob, FFmpegProcessInfo, StreamConfig } from "../types";
import { config } from "../config";
import { AgoraRTCBridge } from "./AgoraRTCBridge";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import path from "path";

interface ProcessEntry {
  process: ChildProcess;
  info: FFmpegProcessInfo;
  retryCount: number;
  rtcBridge?: AgoraRTCBridge; // RTC bridge instance
  videoFifo?: string; // Path to video FIFO
  audioFifo?: string; // Path to audio FIFO
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
    const { channelId, rtmpUrl, streamConfig, agoraToken, agoraChannel } = job;

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

    console.log(`🎬 Starting stream for channel ${channelId}`);

    // Paths for named pipes (FIFOs)
    const tmpDir = "/tmp";
    const videoFifo = path.join(tmpDir, `whynot-video-${channelId}.fifo`);
    const audioFifo = path.join(tmpDir, `whynot-audio-${channelId}.fifo`);

    try {
      // 1. Create named pipes (FIFOs)
      console.log(`📝 Creating FIFOs for channel ${channelId}...`);
      try {
        execSync(`mkfifo ${videoFifo}`, { encoding: "utf-8" });
        execSync(`mkfifo ${audioFifo}`, { encoding: "utf-8" });
        console.log(`✅ FIFOs created: ${videoFifo}, ${audioFifo}`);
      } catch (error) {
        // Ignore error if FIFO already exists
        console.log(
          `⚠️  FIFOs may already exist (continuing): ${error instanceof Error ? error.message : ""}`,
        );
      }

      // 2. Create and connect RTC bridge
      const rtcBridge = new AgoraRTCBridge();
      console.log(`🌐 Connecting to Agora channel ${agoraChannel}...`);

      await rtcBridge.connect({
        appId: config.agora.appId,
        channelName: agoraChannel,
        token: agoraToken,
        workerUid: config.agora.workerUid,
      });

      // 3. Wait for seller to publish video/audio
      console.log(`⏳ Waiting for seller to publish tracks...`);
      await rtcBridge.waitForTracks(60000); // 60s timeout

      // 4. Spawn FFmpeg process with FIFO inputs
      console.log(`🎥 Starting FFmpeg encoder for channel ${channelId}...`);
      const ffmpegArgs = this.buildFFmpegArgs(
        streamConfig,
        rtmpUrl,
        videoFifo,
        audioFifo,
      );
      const ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
        stdio: ["ignore", "pipe", "pipe"], // stdin not used, FFmpeg reads from FIFOs
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
        rtcBridge,
        videoFifo,
        audioFifo,
      });

      // 5. Open write streams to FIFOs
      // Note: FIFOs will block until FFmpeg opens them for reading
      console.log(`🔗 Creating FIFO write streams...`);
      const videoStream = createWriteStream(videoFifo);
      const audioStream = createWriteStream(audioFifo);

      console.log(`✅ FIFO streams created, starting captures...`);

      // 6. Start video and audio capture immediately
      // The streams will unblock as FFmpeg starts reading from the FIFOs
      console.log(`📹 Starting video capture...`);
      await rtcBridge.startVideoCapture(videoStream);

      console.log(`🎤 Starting audio capture...`);
      await rtcBridge.startAudioCapture(audioStream);

      // 7. Setup event handlers
      this.setupProcessHandlers(channelId, ffmpegProcess);

      console.log(`✅ Stream started successfully for channel ${channelId}`);
    } catch (error) {
      console.error(`❌ Failed to start stream ${channelId}:`, error);

      // Cleanup FIFOs on error
      await this.cleanupFifos(videoFifo, audioFifo);

      throw error;
    }
  }

  /**
   * Build FFmpeg command arguments
   */
  private buildFFmpegArgs(
    streamConfig: StreamConfig,
    rtmpUrl: string,
    videoFifo: string,
    audioFifo: string,
  ): string[] {
    // FIXME: Hardcoded to match Canvas resolution (640x360)
    // Should be configurable or match streamConfig.videoResolution
    const resolution = "640x360";

    // FIXME: Hardcoded to 10 FPS to match actual capture rate
    // page.evaluate() is too slow for 30 FPS with current implementation
    const actualFramerate = 10;

    return [
      // Video input (raw YUV from Puppeteer canvas)
      "-f",
      "rawvideo",
      "-pixel_format",
      "yuv420p",
      "-video_size",
      resolution,
      "-framerate",
      actualFramerate.toString(),
      "-thread_queue_size",
      "512", // Increase buffer for async input
      "-i",
      videoFifo,

      // Audio input (WebM/Opus from MediaRecorder)
      "-f",
      "webm", // WebM container with Opus codec
      "-thread_queue_size",
      "512", // Increase buffer for async input
      "-i",
      audioFifo,

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
      (actualFramerate * 2).toString(), // GOP size = 2 seconds

      // Audio encoding (convert mono to stereo)
      "-c:a",
      streamConfig.audioCodec,
      "-b:a",
      `${streamConfig.audioBitrate}k`,
      "-ar",
      "48000",
      "-ac",
      "2", // output stereo (duplicates mono input)

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

      // Exit code 224 or 255 often means normal termination (broken pipe when seller stops)
      // Don't retry in these cases
      const normalExitCodes = [0, 224, 255];

      if (code !== null && !normalExitCodes.includes(code)) {
        entry.info.status = "error";
        this.handleProcessFailure(channelId, new Error(`Exit code: ${code}`));
      } else {
        console.log(`✅ Stream ${channelId} stopped normally`);

        // Cleanup FIFOs on normal exit
        if (entry.videoFifo && entry.audioFifo) {
          this.cleanupFifos(entry.videoFifo, entry.audioFifo).catch(() => {});
        }

        this.processes.delete(channelId);
      }
    });

    // Capture stderr for debugging
    ffmpeg.stderr?.on("data", (data) => {
      const log = data.toString();
      // Ignore "Broken pipe" and "End of file" - these are normal when seller stops
      if (
        (log.includes("error") || log.includes("Error")) &&
        !log.includes("Broken pipe") &&
        !log.includes("End of file")
      ) {
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

      // Clean up FIFO files before retry
      if (entry.videoFifo && entry.audioFifo) {
        await this.cleanupFifos(entry.videoFifo, entry.audioFifo);
      }

      // Disconnect RTC bridge
      if (entry.rtcBridge) {
        await entry.rtcBridge.disconnect().catch(() => {});
      }

      // Clean up failed process
      this.processes.delete(channelId);

      // Wait 5 seconds before retry
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log(`⚠️  Stream ${channelId} needs manual re-enqueue`);
    } else {
      console.error(
        `💀 Stream ${channelId} failed after ${this.MAX_RETRIES} retries`,
      );

      // Final cleanup
      if (entry.videoFifo && entry.audioFifo) {
        await this.cleanupFifos(entry.videoFifo, entry.audioFifo);
      }

      if (entry.rtcBridge) {
        await entry.rtcBridge.disconnect().catch(() => {});
      }

      this.processes.delete(channelId);
    }
  }

  /**
   * Stop stream for a channel
   */
  /**
   * Cleanup FIFO files
   */
  private async cleanupFifos(
    videoFifo: string,
    audioFifo: string,
  ): Promise<void> {
    try {
      await unlink(videoFifo).catch(() => {
        /* ignore if doesn't exist */
      });
      await unlink(audioFifo).catch(() => {
        /* ignore if doesn't exist */
      });
      console.log(`🧹 Cleaned up FIFOs: ${videoFifo}, ${audioFifo}`);
    } catch (error) {
      console.error(`⚠️  Error cleaning up FIFOs:`, error);
    }
  }

  async stopStream(channelId: number): Promise<void> {
    const entry = this.processes.get(channelId);
    if (!entry) {
      console.warn(`⚠️  No active stream for channel ${channelId}`);
      return;
    }

    console.log(`🛑 Stopping stream for channel ${channelId}`);
    entry.info.status = "stopping";

    // 1. Disconnect RTC bridge first
    if (entry.rtcBridge) {
      try {
        console.log(`🌐 Disconnecting RTC bridge...`);
        await entry.rtcBridge.disconnect();
      } catch (error) {
        console.error(`Error disconnecting RTC bridge:`, error);
      }
    }

    // 2. Send SIGTERM to FFmpeg for graceful shutdown
    entry.process.kill("SIGTERM");

    // 3. Cleanup FIFOs
    if (entry.videoFifo && entry.audioFifo) {
      await this.cleanupFifos(entry.videoFifo, entry.audioFifo);
    }

    // 4. Force kill after 10 seconds if not stopped
    setTimeout(() => {
      if (this.processes.has(channelId)) {
        console.warn(`⚠️  Force killing stream ${channelId}`);
        entry.process.kill("SIGKILL");

        // Ensure FIFOs are cleaned up even on force kill
        if (entry.videoFifo && entry.audioFifo) {
          this.cleanupFifos(entry.videoFifo, entry.audioFifo);
        }

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

    // Stop all streams in parallel and wait for completion
    await Promise.all(channelIds.map((id) => this.stopStream(id)));

    // Wait a bit for FFmpeg processes to terminate
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Force kill any remaining
    this.processes.forEach((entry, id) => {
      console.warn(`Force killing stream ${id}`);
      try {
        entry.process.kill("SIGKILL");
      } catch (err) {
        // Process might already be dead
      }
      // Force close browser if still alive
      if (entry.rtcBridge) {
        entry.rtcBridge.disconnect().catch(() => {});
      }
      // Cleanup FIFOs
      if (entry.videoFifo && entry.audioFifo) {
        this.cleanupFifos(entry.videoFifo, entry.audioFifo).catch(() => {});
      }
    });

    this.processes.clear();
    console.log("✅ FFmpegManager shutdown complete");
    process.exit(0);
  }
}

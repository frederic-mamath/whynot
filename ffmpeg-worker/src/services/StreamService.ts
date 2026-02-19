// src/services/StreamService.ts
import { FFmpegManager } from "./FFmpegManager";
import { StreamJob } from "../types";

/**
 * StreamService
 * Business logic for stream management
 */
export class StreamService {
  private ffmpegManager: FFmpegManager;

  constructor(ffmpegManager: FFmpegManager) {
    this.ffmpegManager = ffmpegManager;
    console.log("✅ StreamService initialized");
  }

  /**
   * Start a new stream
   */
  async startStream(job: StreamJob): Promise<void> {
    console.log(`[StreamService] Starting stream for channel ${job.channelId}`);
    await this.ffmpegManager.startStream(job);
  }

  /**
   * Stop an active stream
   */
  stopStream(channelId: number): void {
    console.log(`[StreamService] Stopping stream for channel ${channelId}`);
    this.ffmpegManager.stopStream(channelId);
  }

  /**
   * Get stream status
   */
  getStreamStatus(channelId: number) {
    return this.ffmpegManager.getStreamStatus(channelId);
  }

  /**
   * Get all active streams
   */
  getAllStreams() {
    return this.ffmpegManager.getAllStreams();
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return this.ffmpegManager.getStats();
  }
}

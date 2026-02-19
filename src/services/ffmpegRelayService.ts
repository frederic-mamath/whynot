import { db } from "../db";
import { CloudflareStreamService } from "./cloudflareStreamService";
import { FFmpegQueueService } from "./ffmpegQueueService";
import { generateAgoraToken } from "../utils/agora";

/**
 * FFmpeg Relay Service
 * Orchestrates FFmpeg-based RTC → RTMP relay via worker queue
 *
 * Flow:
 * 1. Create Cloudflare Stream Live Input (RTMP endpoint)
 * 2. Generate Agora RTC token for worker to subscribe to stream
 * 3. Enqueue job to Redis for FFmpeg worker
 * 4. Worker subscribes to RTC, converts to RTMP, pushes to Cloudflare
 */
export class FFmpegRelayService {
  private cloudflareStream: CloudflareStreamService;
  private ffmpegQueue: FFmpegQueueService;

  constructor() {
    this.cloudflareStream = new CloudflareStreamService();
    this.ffmpegQueue = new FFmpegQueueService();
  }

  /**
   * Start FFmpeg relay for a channel
   */
  async startRelay(params: {
    channelId: number;
    channelName: string;
    sellerUid: number;
  }): Promise<{ hlsPlaybackUrl: string; jobId: string }> {
    const { channelId, channelName, sellerUid } = params;

    console.log(`[FFmpegRelay] 🚀 Starting relay for channel ${channelId}`);

    try {
      // 1. Create Cloudflare Stream Live Input
      console.log(
        `[FFmpegRelay] Step 1/4: Creating Cloudflare Stream Live Input...`,
      );
      const streamCredentials = await this.cloudflareStream.createLiveInput({
        channelId,
        enableRecording: true,
        maxDurationSeconds: 7200, // 2 hours
        deleteRecordingAfterDays: 30,
      });
      console.log(`[FFmpegRelay] ✅ Step 1/4: Cloudflare Stream created`);
      console.log(`[FFmpegRelay] RTMPS URL: ${streamCredentials.rtmpsUrl}`);
      console.log(`[FFmpegRelay] HLS URL: ${streamCredentials.hlsPlaybackUrl}`);

      // 2. Generate Agora token for the worker (audience role)
      console.log(
        `[FFmpegRelay] Step 2/4: Generating Agora token for worker...`,
      );
      const workerUid = 999999; // Fixed UID for FFmpeg worker audience
      const agoraToken = generateAgoraToken({
        channelName: channelId.toString(),
        uid: workerUid,
        role: "audience", // Worker subscribes as audience, not publisher
      });
      console.log(
        `[FFmpegRelay] ✅ Step 2/4: Agora token generated for worker UID ${workerUid}`,
      );

      // 3. Update database with relay metadata
      console.log(`[FFmpegRelay] Step 3/4: Updating database...`);
      await db
        .updateTable("channels")
        .set({
          stream_key_id: streamCredentials.streamKeyId,
          hls_playback_url: streamCredentials.hlsPlaybackUrl,
          relay_status: "starting",
          relay_started_at: new Date(),
        })
        .where("id", "=", channelId)
        .execute();
      console.log(`[FFmpegRelay] ✅ Step 3/4: Database updated`);

      // 4. Enqueue job for FFmpeg worker
      console.log(`[FFmpegRelay] Step 4/4: Enqueuing job to Redis...`);
      const jobId = await this.ffmpegQueue.enqueueStreamJob({
        channelId,
        rtmpUrl: streamCredentials.rtmpsUrl,
        agoraChannel: channelId.toString(),
        agoraToken,
      });
      console.log(`[FFmpegRelay] ✅ Step 4/4: Job ${jobId} enqueued`);

      // 5. Update status to active (worker will handle the actual streaming)
      await db
        .updateTable("channels")
        .set({ relay_status: "active" })
        .where("id", "=", channelId)
        .execute();

      console.log(
        `[FFmpegRelay] ✅ SUCCESS - Relay setup complete for channel ${channelId}`,
      );

      return {
        hlsPlaybackUrl: streamCredentials.hlsPlaybackUrl,
        jobId,
      };
    } catch (error) {
      console.error(`[FFmpegRelay] ❌ FAILED for channel ${channelId}:`);
      console.error(
        `[FFmpegRelay] Error:`,
        error instanceof Error ? error.message : String(error),
      );

      // Update status to error
      await db
        .updateTable("channels")
        .set({
          relay_status: "error",
        })
        .where("id", "=", channelId)
        .execute();

      throw error;
    }
  }

  /**
   * Stop FFmpeg relay for a channel
   */
  async stopRelay(channelId: number): Promise<void> {
    console.log(`[FFmpegRelay] 🛑 Stopping relay for channel ${channelId}`);

    try {
      // 1. Get channel data
      const channel = await db
        .selectFrom("channels")
        .select(["stream_key_id", "relay_status"])
        .where("id", "=", channelId)
        .executeTakeFirst();

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      // 2. Remove job from queue (stops FFmpeg worker)
      console.log(`[FFmpegRelay] Step 1/3: Removing job from queue...`);
      await this.ffmpegQueue.removeJob(channelId);
      console.log(`[FFmpegRelay] ✅ Step 1/3: Job removed`);

      // 3. Stop Cloudflare Stream (if stream key exists)
      if (channel.stream_key_id) {
        console.log(`[FFmpegRelay] Step 2/3: Stopping Cloudflare Stream...`);
        await this.cloudflareStream.deleteLiveInput(channel.stream_key_id);
        console.log(`[FFmpegRelay] ✅ Step 2/3: Cloudflare Stream stopped`);
      }

      //4. Update database status
      console.log(`[FFmpegRelay] Step 3/3: Updating database...`);
      await db
        .updateTable("channels")
        .set({
          relay_status: "stopped",
        })
        .where("id", "=", channelId)
        .execute();
      console.log(`[FFmpegRelay] ✅ Step 3/3: Database updated`);

      console.log(
        `[FFmpegRelay] ✅ SUCCESS - Relay stopped for channel ${channelId}`,
      );
    } catch (error) {
      console.error(
        `[FFmpegRelay] ❌ Failed to stop relay for channel ${channelId}:`,
      );
      console.error(
        `[FFmpegRelay] Error:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Get relay status for a channel
   */
  async getRelayStatus(channelId: number): Promise<any> {
    const channel = await db
      .selectFrom("channels")
      .select([
        "id",
        "name",
        "relay_status",
        "relay_started_at",
        "hls_playback_url",
        "stream_key_id",
      ])
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel) {
      return { status: "not_found" };
    }

    // Get active jobs from queue
    const activeJobs = await this.ffmpegQueue.getActiveJobs();
    const hasActiveJob = activeJobs.some((job) => job.channelId === channelId);

    return {
      channelId: channel.id,
      channelName: channel.name,
      relayStatus: channel.relay_status,
      startedAt: channel.relay_started_at,
      hlsPlaybackUrl: channel.hls_playback_url,
      streamKeyId: channel.stream_key_id,
      hasActiveJob,
      activeJobs: hasActiveJob
        ? activeJobs.filter((job) => job.channelId === channelId)
        : [],
    };
  }

  /**
   * Get streaming status (compatible with HybridStreamingService API)
   */
  async getStreamingStatus(channelId: number): Promise<{
    isActive: boolean;
    isLive: boolean;
    relayStatus: string | null;
    hlsPlaybackUrl: string | null;
    recordingUrl: string | null;
  }> {
    const channel = await db
      .selectFrom("channels")
      .select(["relay_status", "hls_playback_url", "stream_recording_url"])
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel) {
      return {
        isActive: false,
        isLive: false,
        relayStatus: null,
        hlsPlaybackUrl: null,
        recordingUrl: null,
      };
    }

    const isActive = channel.relay_status === "active";
    const isLive = isActive; // For FFmpeg relay, active = live

    return {
      isActive,
      isLive,
      relayStatus: channel.relay_status,
      hlsPlaybackUrl: channel.hls_playback_url,
      recordingUrl: channel.stream_recording_url,
    };
  }

  /**
   * Health check - verify FFmpeg worker and Cloudflare are operational
   */
  async healthCheck(): Promise<{
    ffmpegWorker: boolean;
    cloudflare: boolean;
    overall: boolean;
  }> {
    // Check FFmpeg worker health
    let ffmpegWorkerHealthy = false;
    try {
      const response = await fetch("http://localhost:3001/health");
      ffmpegWorkerHealthy = response.ok;
    } catch (error) {
      console.error("[FFmpegRelay] Worker health check failed:", error);
      ffmpegWorkerHealthy = false;
    }

    // Check Cloudflare health
    const cloudflareHealthy = await this.cloudflareStream.isHealthy();

    return {
      ffmpegWorker: ffmpegWorkerHealthy,
      cloudflare: cloudflareHealthy,
      overall: ffmpegWorkerHealthy && cloudflareHealthy,
    };
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    await this.ffmpegQueue.close();
  }
}

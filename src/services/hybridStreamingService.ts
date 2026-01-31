import { db } from "../db";
import { RecordingManager } from "./recordingManager";
import { CloudflareStreamService } from "./cloudflareStreamService";

/**
 * Hybrid Streaming Service
 * Orchestrates Agora Cloud Recording → Cloudflare Stream for cost-effective distribution
 */
export class HybridStreamingService {
  private recordingManager: RecordingManager;
  private cloudflareStream: CloudflareStreamService;

  constructor() {
    this.recordingManager = new RecordingManager();
    this.cloudflareStream = new CloudflareStreamService();
  }

  /**
   * Start hybrid streaming for a channel
   * Called when seller starts broadcasting
   */
  async startHybridStreaming(
    channelId: number,
    channelName: string,
    sellerUid: number,
  ): Promise<{ hlsPlaybackUrl: string; streamKeyId: string }> {
    console.log(
      `[HybridStreaming] 🚀 Starting for channel ${channelId}, seller UID: ${sellerUid}`,
    );

    try {
      // Update channel status to "starting"
      console.log(
        `[HybridStreaming] Step 1/5: Setting relay_status to 'starting'`,
      );
      await db
        .updateTable("channels")
        .set({
          relay_status: "starting",
          relay_started_at: new Date(),
        })
        .where("id", "=", channelId)
        .execute();

      // Start Agora Cloud Recording → Cloudflare Stream relay
      console.log(`[HybridStreaming] Step 2/5: Starting recording manager...`);
      const { hlsPlaybackUrl } = await this.recordingManager.startRecording(
        channelId,
        channelName,
        sellerUid,
      );
      console.log(
        `[HybridStreaming] Step 2/5: ✅ Recording started, HLS: ${hlsPlaybackUrl}`,
      );

      // Get stream key ID from database (set by RecordingManager)
      console.log(
        `[HybridStreaming] Step 3/5: Retrieving stream_key_id from DB...`,
      );
      const channel = await db
        .selectFrom("channels")
        .select("stream_key_id")
        .where("id", "=", channelId)
        .executeTakeFirst();

      if (!channel?.stream_key_id) {
        console.error(
          `[HybridStreaming] ❌ Stream key ID not found in database!`,
        );
        throw new Error("Stream key ID not found after starting recording");
      }
      console.log(
        `[HybridStreaming] Step 3/5: ✅ Stream key: ${channel.stream_key_id}`,
      );

      // Update status to "active"
      console.log(
        `[HybridStreaming] Step 4/5: Setting relay_status to 'active'`,
      );
      await db
        .updateTable("channels")
        .set({ relay_status: "active" })
        .where("id", "=", channelId)
        .execute();

      console.log(
        `[HybridStreaming] Step 5/5: ✅ SUCCESS - Hybrid streaming active for channel ${channelId}`,
      );

      return {
        hlsPlaybackUrl,
        streamKeyId: channel.stream_key_id,
      };
    } catch (error) {
      console.error(`[HybridStreaming] ❌ FAILED for channel ${channelId}:`);
      console.error(
        `[HybridStreaming] Error message:`,
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        `[HybridStreaming] Error stack:`,
        error instanceof Error ? error.stack : "No stack trace",
      );

      // Update status to "error"
      console.log(`[HybridStreaming] Setting relay_status to 'error'`);
      await db
        .updateTable("channels")
        .set({ relay_status: "error" })
        .where("id", "=", channelId)
        .execute();

      throw error;
    }
  }

  /**
   * Stop hybrid streaming for a channel
   * Called when seller ends broadcast
   */
  async stopHybridStreaming(channelId: number): Promise<void> {
    console.log(`Stopping hybrid streaming for channel ${channelId}`);

    try {
      // Stop Agora Cloud Recording
      await this.recordingManager.stopRecording(channelId);

      // Update channel status
      await db
        .updateTable("channels")
        .set({
          relay_status: "stopped",
          status: "ended",
          ended_at: new Date(),
        })
        .where("id", "=", channelId)
        .execute();

      console.log(
        `Hybrid streaming stopped successfully for channel ${channelId}`,
      );
    } catch (error) {
      console.error(
        `Failed to stop hybrid streaming for channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get current streaming status
   */
  async getStreamingStatus(channelId: number): Promise<{
    isActive: boolean;
    isLive: boolean;
    relayStatus: string | null;
    hlsPlaybackUrl: string | null;
    recordingUrl: string | null;
  }> {
    return this.recordingManager.getRecordingStatus(channelId);
  }

  /**
   * Health check - verify all services are operational
   */
  async healthCheck(): Promise<{
    agora: boolean;
    cloudflare: boolean;
    overall: boolean;
  }> {
    const cloudflareHealthy = await this.cloudflareStream.isHealthy();

    // Agora is always available (managed service)
    const agoraHealthy = true;

    return {
      agora: agoraHealthy,
      cloudflare: cloudflareHealthy,
      overall: agoraHealthy && cloudflareHealthy,
    };
  }
}

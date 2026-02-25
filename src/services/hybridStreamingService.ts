import { db } from "../db";
import { FFmpegRelayService } from "./ffmpegRelayService";
import { CloudflareStreamService } from "./cloudflareStreamService";

/**
 * Hybrid Streaming Service
 * Orchestrates FFmpeg Worker → Cloudflare Stream for cost-effective distribution
 */
export class HybridStreamingService {
  private ffmpegRelay: FFmpegRelayService;
  private cloudflareStream: CloudflareStreamService;

  constructor() {
    this.ffmpegRelay = new FFmpegRelayService();
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
      `[HybridStreaming] 🚀 Starting FFmpeg relay for channel ${channelId}, seller UID: ${sellerUid}`,
    );

    try {
      // Start FFmpeg relay (creates Cloudflare Stream + enqueues Redis job)
      console.log(`[HybridStreaming] Starting FFmpeg relay...`);
      const { hlsPlaybackUrl } = await this.ffmpegRelay.startRelay({
        channelId,
        channelName,
        sellerUid,
      });
      console.log(
        `[HybridStreaming] ✅ FFmpeg relay started, HLS: ${hlsPlaybackUrl}`,
      );

      // Get stream key ID from database (set by FFmpegRelayService)
      const channel = await db
        .selectFrom("channels")
        .select("stream_key_id")
        .where("id", "=", channelId)
        .executeTakeFirst();

      if (!channel?.stream_key_id) {
        console.error(
          `[HybridStreaming] ❌ Stream key ID not found in database!`,
        );
        throw new Error("Stream key ID not found after starting relay");
      }
      console.log(`[HybridStreaming] ✅ Stream key: ${channel.stream_key_id}`);

      return {
        hlsPlaybackUrl,
        streamKeyId: channel.stream_key_id,
      };
    } catch (error) {
      console.error(`[HybridStreaming] ❌ FAILED for channel ${channelId}:`);
      console.error(
        `[HybridStreaming] Error:`,
        error instanceof Error ? error.message : String(error),
      );

      // Update status to "error"
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
    console.log(`Stopping FFmpeg relay for channel ${channelId}`);

    try {
      // Stop FFmpeg relay
      await this.ffmpegRelay.stopRelay(channelId);

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

      console.log(`FFmpeg relay stopped successfully for channel ${channelId}`);
    } catch (error) {
      console.error(
        `Failed to stop FFmpeg relay for channel ${channelId}:`,
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
    const channel = await db
      .selectFrom("channels")
      .selectAll()
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    let isLive = false;
    if (channel.stream_key_id) {
      try {
        const status = await this.cloudflareStream.getStreamStatus(
          channel.stream_key_id,
        );
        isLive = status.isLive;
      } catch (error) {
        console.error(
          `Failed to get Cloudflare stream status for channel ${channelId}:`,
          error,
        );
      }
    }

    return {
      isActive: channel.relay_status === "active",
      isLive,
      hlsPlaybackUrl: channel.hls_playback_url,
      recordingUrl: channel.stream_recording_url,
      relayStatus: channel.relay_status,
    };
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

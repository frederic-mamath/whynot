import { db } from "../db";
import { AgoraMediaPushService } from "./agoraMediaPushService";
import { CloudflareStreamService } from "./cloudflareStreamService";
import { AnalyticsService } from "./analyticsService";
import { CostTrackingService } from "./costTrackingService";

/**
 * Recording Manager
 * Orchestrates Agora Media Push → Cloudflare Stream relay
 */
export class RecordingManager {
  private mediaPush: AgoraMediaPushService;
  private cloudflareStream: CloudflareStreamService;
  private analyticsService: AnalyticsService;
  private costTrackingService: CostTrackingService;

  constructor() {
    this.mediaPush = new AgoraMediaPushService();
    this.cloudflareStream = new CloudflareStreamService();
    this.analyticsService = new AnalyticsService(db);
    this.costTrackingService = new CostTrackingService(db);
  }

  /**
   * Start hybrid streaming: Agora Media Push → Cloudflare Stream
   */
  async startRecording(
    channelId: number,
    channelName: string,
    sellerUid: number,
  ): Promise<{ hlsPlaybackUrl: string }> {
    console.log(
      `Starting media push for channel ${channelId} (${channelName})`,
    );

    try {
      // 1. Create Cloudflare Stream Live Input
      const streamCredentials = await this.cloudflareStream.createLiveInput({
        channelId,
        enableRecording: true, // Save VOD
        maxDurationSeconds: 7200, // 2 hours max
        deleteRecordingAfterDays: 30,
      });

      // 2. Start Agora Media Push to Cloudflare RTMPS endpoint
      const { taskId } = await this.mediaPush.start({
        channelName,
        hostUid: sellerUid,
        rtmpUrl: streamCredentials.rtmpsUrl,
        region: "na", // North America
      });

      // 3. Update database with media push metadata
      await db
        .updateTable("channels")
        .set({
          agora_resource_id: taskId, // Store Media Push taskId
          stream_key_id: streamCredentials.streamKeyId,
          hls_playback_url: streamCredentials.hlsPlaybackUrl,
          relay_status: "active",
          relay_started_at: new Date(),
        })
        .where("id", "=", channelId)
        .execute();

      console.log(
        `Media push started successfully for channel ${channelId}: Task ${taskId}, Cloudflare Stream ${streamCredentials.streamKeyId}`,
      );

      return {
        hlsPlaybackUrl: streamCredentials.hlsPlaybackUrl,
      };
    } catch (error) {
      console.error(
        `Failed to start media push for channel ${channelId}:`,
        error,
      );

      // Update status to error
      await db
        .updateTable("channels")
        .set({ relay_status: "error" })
        .where("id", "=", channelId)
        .execute();

      throw error;
    }
  }

  /**
   * Stop media push and cleanup resources
   */
  async stopRecording(channelId: number): Promise<void> {
    console.log(`Stopping media push for channel ${channelId}`);

    try {
      // 1. Get media push info from database
      const channel = await db
        .selectFrom("channels")
        .selectAll()
        .where("id", "=", channelId)
        .executeTakeFirst();

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      if (!channel.agora_resource_id) {
        console.warn(`No active media push for channel ${channelId}`);
        return;
      }

      // 2. Stop Agora Media Push
      await this.mediaPush.stop(channel.agora_resource_id);

      // 3. Update database
      await db
        .updateTable("channels")
        .set({
          relay_status: "inactive",
        })
        .where("id", "=", channelId)
        .execute();

      console.log(`Media push stopped for channel ${channelId}`);
    } catch (error) {
      console.error(
        `Failed to stop media push for channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get current recording status
   */
  async getRecordingStatus(channelId: number): Promise<{
    isActive: boolean;
    isLive: boolean;
    hlsPlaybackUrl: string | null;
    recordingUrl: string | null;
    relayStatus: string | null;
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
   * Query active media push from Agora (for debugging)
   */
  async queryAgoraRecording(channelId: number): Promise<any> {
    const channel = await db
      .selectFrom("channels")
      .select(["agora_resource_id"])
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel?.agora_resource_id) {
      throw new Error(`No active media push for channel ${channelId}`);
    }

    return this.mediaPush.query(channel.agora_resource_id);
  }
}

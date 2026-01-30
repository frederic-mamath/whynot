import { db } from "../db";
import { AgoraCloudRecordingService } from "./agoraCloudRecordingService";
import { CloudflareStreamService } from "./cloudflareStreamService";
import { AnalyticsService } from "./analyticsService";
import { CostTrackingService } from "./costTrackingService";
import { generateRecordingUid } from "../utils/agoraAuth";

/**
 * Recording Manager
 * Orchestrates Agora Cloud Recording → Cloudflare Stream relay
 */
export class RecordingManager {
  private cloudRecording: AgoraCloudRecordingService;
  private cloudflareStream: CloudflareStreamService;
  private analyticsService: AnalyticsService;
  private costTrackingService: CostTrackingService;

  constructor() {
    this.cloudRecording = new AgoraCloudRecordingService();
    this.cloudflareStream = new CloudflareStreamService();
    this.analyticsService = new AnalyticsService(db);
    this.costTrackingService = new CostTrackingService(db);
  }

  /**
   * Start hybrid streaming: Agora Cloud Recording → Cloudflare Stream
   */
  async startRecording(
    channelId: number,
    channelName: string,
    sellerUid: number,
  ): Promise<{ hlsPlaybackUrl: string }> {
    console.log(`Starting recording for channel ${channelId} (${channelName})`);

    try {
      // 1. Create Cloudflare Stream Live Input
      const streamCredentials = await this.cloudflareStream.createLiveInput({
        channelId,
        enableRecording: true, // Save VOD
        maxDurationSeconds: 7200, // 2 hours max
        deleteRecordingAfterDays: 30,
      });

      // 2. Generate recording UID (high range to avoid conflicts)
      const recordingUid = generateRecordingUid();

      // 3. Acquire Agora Cloud Recording resource
      const resourceId = await this.cloudRecording.acquire({
        channelName,
        uid: recordingUid,
      });

      // 4. Start Agora Cloud Recording with RTMP push to Cloudflare
      const storageConfig = {
        vendor: 1, // Not used (RTMP mode)
        region: 0,
      };

      const recordingConfig = {
        channelType: 0, // Live broadcast
        streamTypes: 2, // Audio + Video
        maxIdleTime: 30, // Stop if seller leaves for 30s
      };

      const sid = await this.cloudRecording.start(
        resourceId,
        channelName,
        recordingUid,
        streamCredentials.rtmpsUrl, // RTMP URL for Cloudflare
        storageConfig,
        recordingConfig,
      );

      // 5. Update database with recording metadata
      await db
        .updateTable("channels")
        .set({
          agora_resource_id: resourceId,
          agora_sid: sid,
          agora_recording_uid: recordingUid,
          stream_key_id: streamCredentials.streamKeyId,
          hls_playback_url: streamCredentials.hlsPlaybackUrl,
          relay_status: "active",
          relay_started_at: new Date(),
        })
        .where("id", "=", channelId)
        .execute();

      console.log(
        `Recording started successfully for channel ${channelId}: Agora SID ${sid}, Cloudflare Stream ${streamCredentials.streamKeyId}`,
      );

      return {
        hlsPlaybackUrl: streamCredentials.hlsPlaybackUrl,
      };
    } catch (error) {
      console.error(
        `Failed to start recording for channel ${channelId}:`,
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
   * Stop recording and cleanup resources
   */
  async stopRecording(channelId: number): Promise<void> {
    console.log(`Stopping recording for channel ${channelId}`);

    try {
      // 1. Get recording info from database
      const channel = await db
        .selectFrom("channels")
        .selectAll()
        .where("id", "=", channelId)
        .executeTakeFirst();

      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      if (!channel.agora_resource_id || !channel.agora_sid) {
        console.warn(`No active recording for channel ${channelId}`);
        return;
      }

      // 2. Stop Agora Cloud Recording
      await this.cloudRecording.stop(
        channel.agora_resource_id,
        channel.agora_sid,
        channel.name,
        channel.agora_recording_uid!,
      );

      // 3. Wait for Cloudflare to process final segments
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 4. Get recording URL (VOD) from Cloudflare
      let recordingUrl: string | null = null;
      if (channel.stream_key_id) {
        recordingUrl = await this.cloudflareStream.getRecordingUrl(
          channel.stream_key_id,
        );
      }

      // 5. Update database
      await db
        .updateTable("channels")
        .set({
          relay_status: "stopped",
          stream_recording_url: recordingUrl,
        })
        .where("id", "=", channelId)
        .execute();

      // 6. Record final metrics
      await this.analyticsService.recordMetrics(channelId, {
        relayStatus: "stopped",
        isLive: false,
        durationSeconds: 0,
        cloudflareStreamId: channel.stream_key_id || undefined,
      });

      // 7. Calculate and record costs
      try {
        await this.costTrackingService.recordStreamCosts(channelId);
        console.log(`Metrics and costs recorded for channel ${channelId}`);
      } catch (error) {
        console.error(
          `Failed to record costs for channel ${channelId}:`,
          error,
        );
        // Don't throw - cost recording failure shouldn't prevent stop
      }

      console.log(`Recording stopped successfully for channel ${channelId}`);
    } catch (error) {
      console.error(
        `Failed to stop recording for channel ${channelId}:`,
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
   * Query active recording from Agora (for debugging)
   */
  async queryAgoraRecording(channelId: number): Promise<any> {
    const channel = await db
      .selectFrom("channels")
      .select(["agora_resource_id", "agora_sid"])
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel?.agora_resource_id || !channel?.agora_sid) {
      throw new Error(`No active recording for channel ${channelId}`);
    }

    return this.cloudRecording.query(
      channel.agora_resource_id,
      channel.agora_sid,
    );
  }
}

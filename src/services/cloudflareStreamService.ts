import axios, { AxiosInstance } from "axios";
import {
  CloudflareStreamCredentials,
  CloudflareStreamStatus,
  CreateStreamOptions,
} from "../types/streaming";

/**
 * Cloudflare Stream Service
 * Handles live input creation and HLS distribution
 */
export class CloudflareStreamService {
  private client: AxiosInstance;
  private accountId: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_STREAM_ACCOUNT_ID!;
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

    if (!this.accountId || !apiToken) {
      throw new Error(
        "Missing Cloudflare Stream credentials (CLOUDFLARE_STREAM_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN)",
      );
    }

    this.client = axios.create({
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Create a new Live Input for receiving RTMP stream from Agora Cloud Recording
   */
  async createLiveInput(
    options: CreateStreamOptions,
  ): Promise<CloudflareStreamCredentials> {
    try {
      const response = await this.client.post("/live_inputs", {
        meta: {
          name: `Channel ${options.channelId}`,
          channelId: options.channelId.toString(),
        },
        recording: {
          mode: options.enableRecording ? "automatic" : "off",
          timeoutSeconds: options.maxDurationSeconds || 7200, // 2 hours default
          requireSignedURLs: false, // Public playback
          deleteRecordingAfterDays: options.deleteRecordingAfterDays || 30,
        },
      });

      const data = response.data.result;

      console.log(
        `Cloudflare Live Input created: ${data.uid} for channel ${options.channelId}`,
      );

      return {
        streamKeyId: data.uid,
        rtmpUrl: data.rtmps.url.replace("rtmps://", "rtmp://"), // For testing
        rtmpsUrl: data.rtmps.url, // Secure URL (recommended for production)
        hlsPlaybackUrl: data.playback.hls,
        dashPlaybackUrl: data.playback.dash,
      };
    } catch (error) {
      console.error("Failed to create Cloudflare Live Input:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
      }
      throw new Error("Failed to create Cloudflare Live Input");
    }
  }

  /**
   * Get HLS playback URL for a live input
   */
  async getPlaybackUrl(streamKeyId: string): Promise<string> {
    try {
      const response = await this.client.get(`/live_inputs/${streamKeyId}`);
      return response.data.result.playback.hls;
    } catch (error) {
      console.error("Failed to get Cloudflare playback URL:", error);
      throw new Error("Failed to get playback URL");
    }
  }

  /**
   * Get stream status (live/offline, duration, etc.)
   */
  async getStreamStatus(streamKeyId: string): Promise<CloudflareStreamStatus> {
    try {
      const response = await this.client.get(`/live_inputs/${streamKeyId}`);
      const data = response.data.result;

      const isLive = data.status?.current === "live";
      const durationSeconds = data.status?.duration || 0;

      // Check if recording exists (after stream ends)
      let recordingAvailable = false;
      if (data.recording?.uid) {
        try {
          await this.client.get(`/${data.recording.uid}`);
          recordingAvailable = true;
        } catch {
          recordingAvailable = false;
        }
      }

      return {
        isLive,
        durationSeconds,
        recordingAvailable,
        viewerCount: undefined, // Not available from Cloudflare API
      };
    } catch (error) {
      console.error("Failed to get Cloudflare stream status:", error);
      throw new Error("Failed to get stream status");
    }
  }

  /**
   * Delete a live input (cleanup after channel ends)
   */
  async deleteLiveInput(streamKeyId: string): Promise<void> {
    try {
      await this.client.delete(`/live_inputs/${streamKeyId}`);
      console.log(`Cloudflare Live Input deleted: ${streamKeyId}`);
    } catch (error) {
      console.error("Failed to delete Cloudflare Live Input:", error);
      // Don't throw - deletion failure shouldn't block channel cleanup
    }
  }

  /**
   * Health check - verify API credentials and connectivity
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.get("/live_inputs?limit=1");
      return true;
    } catch (error) {
      console.error("Cloudflare Stream health check failed:", error);
      return false;
    }
  }

  /**
   * Get recording URL (VOD) after stream ends
   */
  async getRecordingUrl(streamKeyId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/live_inputs/${streamKeyId}`);
      const recordingUid = response.data.result.recording?.uid;

      if (!recordingUid) {
        return null;
      }

      // Get recording details
      const recordingResponse = await this.client.get(`/${recordingUid}`);
      return recordingResponse.data.result.playback.hls;
    } catch (error) {
      console.error("Failed to get recording URL:", error);
      return null;
    }
  }
}

import axios, { AxiosInstance } from "axios";
import { getAgoraAuthHeader } from "../utils/agoraAuth";

/**
 * Agora Media Push Service
 * Pushes RTC stream to RTMP endpoint (Cloudflare Stream) in real-time
 *
 * API Documentation:
 * https://docs.agora.io/en/media-push/develop/push-stream-to-cdn
 */

interface MediaPushStartRequest {
  rtcChannel: string;
  host: {
    uid: string; // UID of the host to relay (as string)
  };
  rtmpUrl: string;
  region?: string; // "na", "eu", "ap", "cn"
}

interface MediaPushStartResponse {
  taskId: string;
  createTs: number;
}

interface MediaPushStatusResponse {
  taskId: string;
  status: "idle" | "running" | "exit";
  rtcChannel: string;
  region: string;
  createTs: number;
  destroyTs?: number;
}

export class AgoraMediaPushService {
  private client: AxiosInstance;
  private appId: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID!;

    if (!this.appId) {
      throw new Error("Missing AGORA_APP_ID environment variable");
    }

    this.client = axios.create({
      baseURL: "https://api.agora.io/v1/projects",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Start Media Push: Push RTC stream to RTMP endpoint
   */
  async start(params: {
    channelName: string;
    hostUid: number;
    rtmpUrl: string;
    region?: string;
  }): Promise<{ taskId: string }> {
    const requestBody = {
      converter: {
        name: `channel-${params.channelName}`,
        transcodeMode: "postponeTranscoding",
      },
      rtcChannel: params.channelName,
      rtmpUrl: params.rtmpUrl,
      region: params.region || "na",
    };

    try {
      console.log(
        `[MediaPush] Starting push for channel ${params.channelName} → ${params.rtmpUrl}`,
      );

      const response = await this.client.post<MediaPushStartResponse>(
        `/${this.appId}/rtmp-converters`,
        requestBody,
        {
          headers: {
            Authorization: getAgoraAuthHeader(),
          },
        },
      );

      console.log(`[MediaPush] ✅ Task started: ${response.data.taskId}`);

      return {
        taskId: response.data.taskId,
      };
    } catch (error) {
      console.error("[MediaPush] ❌ Failed to start:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          "[MediaPush] Response:",
          error.response.status,
          error.response.data,
        );
      }
      throw new Error("Failed to start Agora Media Push");
    }
  }

  /**
   * Query Media Push status
   */
  async query(taskId: string): Promise<MediaPushStatusResponse> {
    try {
      const response = await this.client.get<MediaPushStatusResponse>(
        `/${this.appId}/rtmp-converters/${taskId}`,
        {
          headers: {
            Authorization: getAgoraAuthHeader(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(`[MediaPush] ❌ Failed to query task ${taskId}:`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          "[MediaPush] Response:",
          error.response.status,
          error.response.data,
        );
      }
      throw new Error("Failed to query Agora Media Push status");
    }
  }

  /**
   * Stop Media Push
   */
  async stop(taskId: string): Promise<void> {
    try {
      console.log(`[MediaPush] Stopping task ${taskId}...`);

      await this.client.delete(`/${this.appId}/rtmp-converters/${taskId}`, {
        headers: {
          Authorization: getAgoraAuthHeader(),
        },
      });

      console.log(`[MediaPush] ✅ Task ${taskId} stopped`);
    } catch (error) {
      console.error(`[MediaPush] ❌ Failed to stop task ${taskId}:`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          "[MediaPush] Response:",
          error.response.status,
          error.response.data,
        );
      }
      throw new Error("Failed to stop Agora Media Push");
    }
  }
}

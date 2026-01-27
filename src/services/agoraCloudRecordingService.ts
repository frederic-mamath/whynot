import axios, { AxiosInstance } from "axios";
import {
  AgoraAcquireRequest,
  AgoraAcquireResponse,
  AgoraStartRequest,
  AgoraStartResponse,
  AgoraQueryResponse,
  AgoraStopResponse,
} from "../types/agora";
import { getAgoraAuthHeader } from "../utils/agoraAuth";

/**
 * Agora Cloud Recording Service
 * Handles RTMP forwarding from Agora RTC to Cloudflare Stream
 */
export class AgoraCloudRecordingService {
  private client: AxiosInstance;
  private appId: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID!;

    if (!this.appId) {
      throw new Error("Missing AGORA_APP_ID environment variable");
    }

    this.client = axios.create({
      baseURL: "https://api.agora.io/v1/apps",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Step 1: Acquire a resource ID for cloud recording
   * Must be called before starting recording
   */
  async acquire(params: { channelName: string; uid: number }): Promise<string> {
    const requestBody: AgoraAcquireRequest = {
      cname: params.channelName,
      uid: params.uid.toString(),
      clientRequest: {
        resourceExpiredHour: 24,
        scene: 0, // Real-time recording
      },
    };

    try {
      const response = await this.client.post<AgoraAcquireResponse>(
        `/${this.appId}/cloud_recording/acquire`,
        requestBody,
        {
          headers: {
            Authorization: getAgoraAuthHeader(),
          },
        },
      );

      console.log(
        `Agora Cloud Recording resource acquired: ${response.data.resourceId}`,
      );

      return response.data.resourceId;
    } catch (error) {
      console.error("Failed to acquire Agora Cloud Recording resource:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
      }
      throw new Error("Failed to acquire Agora Cloud Recording resource");
    }
  }

  /**
   * Step 2: Start cloud recording with RTMP push to Cloudflare Stream
   */
  async start(
    resourceId: string,
    channelName: string,
    uid: number,
    rtmpPushUrl: string,
    storageConfig?: {
      vendor: number;
      region: number;
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
    },
    recordingConfig?: {
      channelType?: number;
      streamTypes?: number;
      maxIdleTime?: number;
    },
  ): Promise<string> {
    const requestBody: AgoraStartRequest = {
      cname: channelName,
      uid: uid.toString(),
      clientRequest: {
        recordingConfig: {
          channelType: recordingConfig?.channelType ?? 0, // 0 = communication
          streamTypes: recordingConfig?.streamTypes ?? 2, // 2 = audio + video
          maxIdleTime: recordingConfig?.maxIdleTime ?? 30, // Stop after 30s of no publisher
        },
        storageConfig: storageConfig ?? {
          vendor: 1, // Not used in RTMP mode, but required by API
          region: 0,
        },
        extensionServiceConfig: {
          errorHandlePolicy: "error_abort", // Abort on error
          extensionServices: [
            {
              serviceName: "rtmp_publish",
              errorHandlePolicy: "error_abort",
              serviceParam: {
                outputs: [
                  {
                    rtmpUrl: rtmpPushUrl,
                  },
                ],
              },
            },
          ],
        },
      },
    };

    try {
      const response = await this.client.post<AgoraStartResponse>(
        `/${this.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
        requestBody,
        {
          headers: {
            Authorization: getAgoraAuthHeader(),
          },
        },
      );

      console.log(
        `Agora Cloud Recording started: SID ${response.data.sid}, pushing to ${rtmpPushUrl}`,
      );

      return response.data.sid;
    } catch (error) {
      console.error("Failed to start Agora Cloud Recording:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
      }
      throw new Error("Failed to start Agora Cloud Recording");
    }
  }

  /**
   * Query the status of an ongoing recording
   */
  async query(resourceId: string, sid: string): Promise<AgoraQueryResponse> {
    try {
      const response = await this.client.get<AgoraQueryResponse>(
        `/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
        {
          headers: {
            Authorization: getAgoraAuthHeader(),
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error("Failed to query Agora Cloud Recording status:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
      }
      throw new Error("Failed to query Agora Cloud Recording status");
    }
  }

  /**
   * Stop cloud recording
   */
  async stop(
    resourceId: string,
    sid: string,
    channelName: string,
    uid: number,
  ): Promise<void> {
    const requestBody = {
      cname: channelName,
      uid: uid.toString(),
      clientRequest: {},
    };

    try {
      const response = await this.client.post<AgoraStopResponse>(
        `/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
        requestBody,
        {
          headers: {
            Authorization: getAgoraAuthHeader(),
          },
        },
      );

      console.log(
        `Agora Cloud Recording stopped: SID ${sid}, ResourceID ${resourceId}`,
      );
    } catch (error) {
      console.error("Failed to stop Agora Cloud Recording:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
      }
      throw new Error("Failed to stop Agora Cloud Recording");
    }
  }
}

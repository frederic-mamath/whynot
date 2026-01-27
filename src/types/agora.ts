// Agora Cloud Recording Types
export interface AgoraCloudRecordingCredentials {
  appId: string;
  certificate: string;
  customerId: string;
  customerSecret: string;
}

export interface AgoraAcquireRequest {
  cname: string; // Channel name
  uid: string; // Recording UID
  clientRequest: {
    resourceExpiredHour?: number; // Default: 24
    scene?: number; // 0 = real-time recording
  };
}

export interface AgoraAcquireResponse {
  resourceId: string;
}

export interface AgoraStartRequest {
  cname: string;
  uid: string;
  clientRequest: {
    token?: string;
    recordingConfig: {
      channelType: number; // 0 = communication, 1 = live broadcast
      streamTypes: number; // 0 = audio only, 1 = video only, 2 = audio + video
      maxIdleTime?: number; // Seconds before auto-stop (default: 30)
      audioProfile?: number; // 0 = default, 1 = high quality
      videoStreamType?: number; // 0 = high stream, 1 = low stream
    };
    recordingFileConfig?: {
      avFileType: string[]; // ["hls", "mp4"]
    };
    storageConfig: {
      vendor: number; // 1 = AWS S3, 2 = Aliyun, etc. (not used in RTMP mode)
      region: number;
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
    };
    extensionServiceConfig?: {
      errorHandlePolicy?: string;
      extensionServices: Array<{
        serviceName: "rtmp_publish";
        errorHandlePolicy?: string;
        serviceParam: {
          outputs: Array<{
            rtmpUrl: string;
          }>;
        };
      }>;
    };
  };
}

export interface AgoraStartResponse {
  sid: string; // Session ID
  resourceId: string;
}

export interface AgoraQueryResponse {
  resourceId: string;
  sid: string;
  serverResponse: {
    status: number; // 0 = idle, 1 = in progress, 2 = exited
    fileListMode?: string;
    fileList?: string;
    extensionServiceState?: Array<{
      serviceName: string;
      payload: {
        state: string; // "READY", "RUNNING", "EXIT"
        videoStreamUid?: string;
      };
    }>;
  };
}

export interface AgoraStopResponse {
  resourceId: string;
  sid: string;
  serverResponse: {
    fileListMode?: string;
    fileList?: string;
    uploadingStatus?: string;
  };
}

import { RtcTokenBuilder, RtcRole } from 'agora-token';

const getCredentials = () => {
  const APP_ID = process.env.AGORA_APP_ID;
  const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
  return { APP_ID, APP_CERTIFICATE };
};

export interface TokenOptions {
  channelName: string;
  uid: number;
  role: 'host' | 'audience';
  expirationTimeInSeconds?: number;
}

/**
 * Generate Agora RTC token for channel access
 * @param options Token generation options
 * @returns Agora RTC token string
 */
export function generateAgoraToken(options: TokenOptions): string {
  const { APP_ID, APP_CERTIFICATE } = getCredentials();
  
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error('Agora credentials not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE in .env');
  }

  const {
    channelName,
    uid,
    role,
    expirationTimeInSeconds = 3600, // Default: 1 hour
  } = options;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Convert role to Agora role
  const agoraRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  // Generate token
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    agoraRole,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return token;
}

/**
 * Get Agora App ID (safe to expose to client)
 */
export function getAgoraAppId(): string {
  const { APP_ID } = getCredentials();
  
  if (!APP_ID) {
    throw new Error('Agora App ID not configured. Set AGORA_APP_ID in .env');
  }
  return APP_ID;
}

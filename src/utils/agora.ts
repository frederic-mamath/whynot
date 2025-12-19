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

  // Convert role to Agora role
  const agoraRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  console.log('🔑 Generating Agora token:', {
    appId: APP_ID,
    channelName,
    uid,
    role,
    agoraRole,
    tokenExpire: expirationTimeInSeconds,
    privilegeExpire: expirationTimeInSeconds,
  });

  // Generate token
  // NOTE: tokenExpire and privilegeExpire are DURATIONS in seconds, not timestamps
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    agoraRole,
    expirationTimeInSeconds, // Duration: token valid for X seconds from now
    expirationTimeInSeconds  // Duration: privilege valid for X seconds from now
  );

  console.log('✅ Token generated successfully');

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

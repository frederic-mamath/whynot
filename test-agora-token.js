const { RtcTokenBuilder, RtcRole } = require('agora-token');
require('dotenv').config();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

console.log('Testing Agora Token Generation');
console.log('================================');
console.log('App ID:', APP_ID);
console.log('App Certificate:', APP_CERTIFICATE ? '***' + APP_CERTIFICATE.slice(-4) : 'MISSING');
console.log('');

if (!APP_ID || !APP_CERTIFICATE) {
  console.error('❌ Missing credentials!');
  process.exit(1);
}

// Test parameters
const channelName = '1';
const uid = 1;
const role = RtcRole.SUBSCRIBER;
const expirationTimeInSeconds = 3600;

console.log('Token Parameters:');
console.log('  Channel Name:', channelName);
console.log('  UID:', uid);
console.log('  Role:', role === RtcRole.SUBSCRIBER ? 'SUBSCRIBER' : 'PUBLISHER');
console.log('  Expiration:', expirationTimeInSeconds, 'seconds');
console.log('');

try {
  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    expirationTimeInSeconds,
    expirationTimeInSeconds
  );
  
  console.log('✅ Token generated successfully!');
  console.log('Token:', token);
  console.log('Token length:', token.length);
} catch (error) {
  console.error('❌ Failed to generate token:', error.message);
  process.exit(1);
}

const { RtcTokenBuilder, RtcRole } = require('agora-token');
require('dotenv').config();

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

console.log('='.repeat(60));
console.log('AGORA CONFIGURATION DIAGNOSTIC');
console.log('='.repeat(60));
console.log('');

// 1. Check credentials
console.log('1️⃣  CREDENTIALS CHECK');
console.log('   App ID:', APP_ID || '❌ MISSING');
console.log('   App ID Length:', APP_ID ? APP_ID.length : 0, '(should be 32)');
console.log('   App Certificate:', APP_CERTIFICATE ? '✅ Present (***' + APP_CERTIFICATE.slice(-4) + ')' : '❌ MISSING');
console.log('   App Certificate Length:', APP_CERTIFICATE ? APP_CERTIFICATE.length : 0, '(should be 32)');
console.log('');

if (!APP_ID || !APP_CERTIFICATE) {
  console.error('❌ Missing credentials! Cannot proceed.');
  process.exit(1);
}

if (APP_ID.length !== 32) {
  console.warn('⚠️  WARNING: App ID should be 32 characters');
}

if (APP_CERTIFICATE.length !== 32) {
  console.warn('⚠️  WARNING: App Certificate should be 32 characters');
}

// 2. Test token generation with different parameters
console.log('2️⃣  TOKEN GENERATION TESTS');
console.log('');

const testCases = [
  { channelName: '1', uid: 1, role: RtcRole.PUBLISHER, roleName: 'PUBLISHER' },
  { channelName: '1', uid: 1, role: RtcRole.SUBSCRIBER, roleName: 'SUBSCRIBER' },
  { channelName: 'test-channel', uid: 0, role: RtcRole.PUBLISHER, roleName: 'PUBLISHER' },
];

testCases.forEach((testCase, index) => {
  console.log(`   Test ${index + 1}: Channel="${testCase.channelName}", UID=${testCase.uid}, Role=${testCase.roleName}`);
  
  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      testCase.channelName,
      testCase.uid,
      testCase.role,
      3600,
      3600
    );
    
    console.log(`   ✅ Token: ${token.substring(0, 40)}...`);
    console.log(`   Length: ${token.length} characters`);
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
  }
  console.log('');
});

console.log('3️⃣  COMMON ISSUES TO CHECK IN AGORA CONSOLE:');
console.log('   • Go to: https://console.agora.io/');
console.log('   • Select your project with App ID:', APP_ID);
console.log('   • Check "Primary Certificate" is ENABLED');
console.log('   • Verify the certificate matches your .env file');
console.log('   • Make sure project authentication is set to "App ID + Token"');
console.log('   • NOT "App ID + Token + Co-host authentication"');
console.log('');

console.log('4️⃣  NEXT STEPS:');
console.log('   1. Compare the App Certificate in console with your .env');
console.log('   2. Try generating a token in Agora Console and compare');
console.log('   3. Check browser console for exact error message');
console.log('   4. Verify Agora SDK version compatibility');
console.log('');
console.log('='.repeat(60));

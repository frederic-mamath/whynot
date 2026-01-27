/**
 * Agora Cloud Recording Authentication Helper
 * Generates Basic Auth header and recording UIDs
 */

/**
 * Generate Basic Authentication header for Agora Cloud Recording API
 * Format: "Basic base64(Customer ID:Customer Secret)"
 */
export function getAgoraAuthHeader(): string {
  const customerId = process.env.AGORA_CUSTOMER_ID;
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET;

  if (!customerId || !customerSecret) {
    throw new Error(
      "Missing Agora Cloud Recording credentials (AGORA_CUSTOMER_ID, AGORA_CUSTOMER_SECRET)",
    );
  }

  const credentials = `${customerId}:${customerSecret}`;
  const base64Credentials = Buffer.from(credentials).toString("base64");

  return `Basic ${base64Credentials}`;
}

/**
 * Generate a unique UID for the recording bot
 * Must be a string representation of a 32-bit unsigned integer
 * Should be unique and not conflict with real users
 */
export function generateRecordingUid(): number {
  // Generate a large random UID in the high range (900000000 - 999999999)
  // to avoid conflicts with real user UIDs (typically 1 - 100000000)
  const min = 900000000;
  const max = 999999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Validate Agora configuration on startup
 */
export function validateAgoraConfig(): void {
  const requiredVars = [
    "AGORA_APP_ID",
    "AGORA_APP_CERTIFICATE",
    "AGORA_CUSTOMER_ID",
    "AGORA_CUSTOMER_SECRET",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Agora environment variables: ${missing.join(", ")}`,
    );
  }
}

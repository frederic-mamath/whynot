import Constants from "expo-constants";

/**
 * App configuration — reads from Expo Constants (environment variables).
 *
 * In development: point to your local machine's IP address
 * In production: point to the Render deployment
 */

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Base HTTP URL for the backend API.
 * - Dev: http://192.168.1.X:3000
 * - Prod: https://whynot-app.onrender.com
 */
export function getApiUrl(): string {
  return extra.apiUrl ?? "https://whynot-app.onrender.com";
}

/**
 * WebSocket URL for the backend.
 * - Dev: ws://192.168.1.X:3000
 * - Prod: wss://whynot-app.onrender.com
 */
export function getWsUrl(): string {
  if (extra.wsUrl) return extra.wsUrl;

  // Derive from API URL
  const apiUrl = getApiUrl();
  return apiUrl.replace(/^http/, "ws");
}

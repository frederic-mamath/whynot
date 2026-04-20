import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

export function getApiUrl(): string {
  return extra.apiUrl ?? "https://whynot-app.onrender.com";
}

export function getWsUrl(): string {
  if (extra.wsUrl) return extra.wsUrl;
  return getApiUrl().replace(/^http/, "ws");
}

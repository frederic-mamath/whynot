// Safe dynamic loader for react-native-agora.
// The XCFramework binary is incompatible with iOS 26 beta — loading it crashes the module.
// All runtime values are loaded via require() so a failed load doesn't crash the route.

let mod: typeof import("react-native-agora") | null = null;
try {
  mod = require("react-native-agora");
} catch {}

export const isAgoraAvailable = mod !== null;
export const createAgoraRtcEngine = mod?.createAgoraRtcEngine ?? null;
export const RtcSurfaceView = mod?.RtcSurfaceView ?? null;
export const ChannelProfileType = mod?.ChannelProfileType;
export const ClientRoleType = mod?.ClientRoleType;

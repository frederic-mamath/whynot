/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, no-console -- TODO: JSI bridge boundary; L1 follow-up will type the public surface */
// Native Agora viewer module — wraps AgoraRtcEngine_iOS directly, bypassing
// the react-native-agora XCFramework that is incompatible with iOS 26 on device.

import React from 'react';

let NativeModule: any = null;
let NativeEmitter: any = null;
let NativeViewManager: any = null;

try {
  const core = require('expo-modules-core');
  const registeredModules = Object.keys((globalThis as any).expo?.modules ?? {});
  console.log('[Agora] Registered expo modules:', registeredModules.join(', ') || '(none)');
  NativeModule = core.requireNativeModule('AgoraViewer');
  NativeEmitter = new core.EventEmitter(NativeModule);
  NativeViewManager = core.requireNativeViewManager('AgoraViewer');
} catch (e) {
  console.error('[Agora] Failed to load AgoraViewer native module:', e);
  const registeredModules = Object.keys((globalThis as any).expo?.modules ?? {});
  console.error('[Agora] Registered expo modules at time of failure:', registeredModules.join(', ') || '(none)');
}

export const isAgoraAvailable = NativeModule !== null;

export function createAgoraRtcEngine() {
  const subs: { remove: () => void }[] = [];

  return {
    initialize(config: { appId: string; channelProfile?: number }) {
      return NativeModule.initialize(config.appId);
    },

    // These are handled in Swift initialize — kept as no-ops for API compatibility.
    setClientRole(_role: number) {},
    enableVideo() {},

    addListener(event: 'onUserJoined' | 'onUserOffline', cb: (...args: any[]) => void) {
      if (!NativeEmitter) return;
      if (event === 'onUserJoined') {
        subs.push(
          NativeEmitter.addListener('onUserJoined', (d: { uid: number; elapsed: number }) =>
            cb({}, d.uid, d.elapsed)
          )
        );
      } else if (event === 'onUserOffline') {
        subs.push(
          NativeEmitter.addListener('onUserOffline', (d: { uid: number; reason: number }) =>
            cb({}, d.uid, d.reason)
          )
        );
      }
    },

    removeAllListeners() {
      subs.forEach(s => s.remove());
      subs.length = 0;
    },

    joinChannel(token: string, channelName: string, uid: number, _opts: object) {
      return NativeModule.joinChannel(token ?? null, channelName, uid);
    },

    leaveChannel() {
      return NativeModule.leaveChannel();
    },

    release() {
      return NativeModule.release();
    },
  };
}

// RtcSurfaceView-compatible component backed by AgoraViewerView.swift
export const RtcSurfaceView = NativeViewManager
  ? ({ canvas, style }: { canvas: { uid: number }; style?: any }) =>
      React.createElement(NativeViewManager, { uid: canvas.uid, style })
  : null;

// Local camera preview for the broadcaster (seller hosting a live).
export const RtcLocalView = NativeViewManager
  ? ({ style }: { style?: any }) =>
      React.createElement(NativeViewManager, { local: true, uid: 0, style })
  : null;

// Stub constants — values unused in new implementation but kept for compatibility.
export const ChannelProfileType = { ChannelProfileLiveBroadcasting: 1 };
export const ClientRoleType = { ClientRoleAudience: 2, ClientRoleBroadcaster: 1 };
export const ClientRoleBroadcaster = 1;
export const ClientRoleAudience = 2;

// Broadcaster (host) APIs — separate from createAgoraRtcEngine which targets audience.
export async function initializeBroadcaster(appId: string): Promise<void> {
  if (!NativeModule) throw new Error("Agora native module not available");
  return NativeModule.initializeBroadcaster(appId);
}

export async function joinChannelAsBroadcaster(
  token: string | null,
  channelName: string,
  uid: number,
): Promise<void> {
  if (!NativeModule) throw new Error("Agora native module not available");
  return NativeModule.joinChannelAsBroadcaster(token ?? null, channelName, uid);
}

export async function stopBroadcaster(): Promise<void> {
  if (!NativeModule) return;
  return NativeModule.stopBroadcaster();
}

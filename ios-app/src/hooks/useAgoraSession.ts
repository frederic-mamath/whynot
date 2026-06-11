// Agora lifecycle hooks. The buyer (audience) and seller (broadcaster)
// flows use entirely separate native APIs — engine-object methods vs
// standalone module functions — so they live as two hooks in this file
// instead of a single role-switched hook. They share no internal state
// but follow the same shape: own the tRPC join/start mutation, own the
// native session, await teardown on unmount.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  initializeBroadcaster,
  isAgoraAvailable,
  joinChannelAsBroadcaster,
  stopBroadcaster,
} from "@/lib/agora";
import { trpc } from "@/lib/trpc";
import { useErrorBanner } from "@/hooks/useErrorBanner";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";

type Engine = ReturnType<typeof createAgoraRtcEngine>;

// ────────────────────────────────────────────────────────────────────────────
// Audience (buyer) — joins a live to watch
// ────────────────────────────────────────────────────────────────────────────

type AudienceJoinResult = {
  liveStatus: "active" | "upcoming" | "ended";
  channel: { id: number; host_id?: number };
  token?: string;
  appId?: string;
  uid?: number;
};

export type AudienceLiveStatus = "loading" | "active" | "upcoming" | "ended";

export type UseAgoraAudienceResult = {
  liveStatus: AudienceLiveStatus;
  joined: boolean;
  remoteUid: number | null;
};

export function useAgoraAudience({
  channelId,
  enabled,
}: {
  channelId: number;
  enabled: boolean;
}): UseAgoraAudienceResult {
  const engineRef = useRef<Engine | null>(null);
  const [liveStatus, setLiveStatus] = useState<AudienceLiveStatus>("loading");
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  const { showError } = useErrorBanner();
  const { mutateAsync: joinAsync } = trpc.live.join.useMutation(
    useMutationWithToast(),
  );
  const { mutate: leave } = trpc.live.leave.useMutation(useMutationWithToast());

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void (async () => {
      let data: AudienceJoinResult;
      try {
        data = (await joinAsync({ channelId })) as AudienceJoinResult;
      } catch {
        // useMutationWithToast already surfaced the error.
        if (!cancelled) setLiveStatus("ended");
        return;
      }
      if (cancelled) return;
      setLiveStatus(data.liveStatus);

      if (data.liveStatus !== "active") return;
      if (!isAgoraAvailable || createAgoraRtcEngine === null) return;
      const { token, appId, uid, channel } = data;
      if (token === undefined || appId === undefined || uid === undefined) return;

      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      try {
        engine.initialize({
          appId,
          channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
        });
        engine.setClientRole(ClientRoleType.ClientRoleAudience);
        engine.enableVideo();
        engine.addListener("onUserJoined", (_evt, joinedUid: number) => {
          if (!cancelled) setRemoteUid(joinedUid);
        });
        engine.addListener("onUserOffline", () => {
          if (!cancelled) setRemoteUid(null);
        });
        await engine.joinChannel(token, channel.id.toString(), uid, {});
        if (!cancelled) setJoined(true);
      } catch (e) {
        showError(
          e instanceof Error ? e.message : "Impossible de rejoindre le live",
        );
      }
    })();

    return () => {
      cancelled = true;
      const engine = engineRef.current;
      engineRef.current = null;
      void (async () => {
        if (engine !== null) {
          engine.removeAllListeners();
          await engine.leaveChannel().catch(() => null);
          engine.release();
        }
        leave({ channelId });
      })();
    };
  }, [channelId, enabled, joinAsync, leave, showError]);

  return { liveStatus, joined, remoteUid };
}

// ────────────────────────────────────────────────────────────────────────────
// Broadcaster (seller) — hosts a live and streams local camera
// ────────────────────────────────────────────────────────────────────────────

type BroadcasterJoinResult = {
  token: string;
  appId: string;
  uid: number;
  channel: { id: number };
};

export type UseAgoraBroadcasterResult = {
  hasInitialized: boolean;
  isBroadcasting: boolean;
  startBroadcast: () => Promise<void>;
  stopBroadcast: () => Promise<void>;
};

export function useAgoraBroadcaster({
  channelId,
  onInitializationFailed,
}: {
  channelId: number;
  onInitializationFailed?: () => void;
}): UseAgoraBroadcasterResult {
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const joinDataRef = useRef<BroadcasterJoinResult | null>(null);

  const { showError } = useErrorBanner();
  const { mutateAsync: startAsync } = trpc.live.start.useMutation(
    useMutationWithToast(),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let data: BroadcasterJoinResult;
      try {
        data = (await startAsync({ channelId })) as BroadcasterJoinResult;
      } catch {
        if (!cancelled) onInitializationFailed?.();
        return;
      }
      if (cancelled) return;
      joinDataRef.current = data;

      if (!isAgoraAvailable) return;
      try {
        await initializeBroadcaster(data.appId);
        if (!cancelled) setHasInitialized(true);
      } catch (e) {
        showError(
          e instanceof Error ? e.message : "Impossible d'initialiser le live",
        );
        if (!cancelled) onInitializationFailed?.();
      }
    })();

    return () => {
      cancelled = true;
      void stopBroadcaster().catch(() => null);
    };
  }, [channelId, startAsync, showError, onInitializationFailed]);

  const startBroadcast = useCallback(async () => {
    const data = joinDataRef.current;
    if (data === null) return;
    try {
      await joinChannelAsBroadcaster(
        data.token,
        data.channel.id.toString(),
        data.uid,
      );
      setIsBroadcasting(true);
    } catch (e) {
      showError(
        e instanceof Error ? e.message : "Impossible de démarrer la diffusion",
      );
    }
  }, [showError]);

  const stopBroadcast = useCallback(async () => {
    await stopBroadcaster().catch(() => null);
    setIsBroadcasting(false);
  }, []);

  return { hasInitialized, isBroadcasting, startBroadcast, stopBroadcast };
}

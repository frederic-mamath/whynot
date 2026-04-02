import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";

export interface ChannelConfig {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
  isHost: boolean;
}

export const useAgora = (liveId: string | undefined) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<
    Map<number, IAgoraRTCRemoteUser>
  >(new Map());
  const [, setScreenTrack] = useState<ICameraVideoTrack | null>(null);

  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const screenTrackRef = useRef<ICameraVideoTrack | null>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  const [joined, setJoined] = useState(false);
  const [liveStatus, setLiveStatus] = useState<
    "upcoming" | "active" | "ended" | null
  >(null);
  const [liveMeta, setLiveMeta] = useState<{
    name: string;
    startsAt: string;
    endsAt: string | null;
  } | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [error, setError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [channelConfig, setChannelConfig] = useState<ChannelConfig | null>(
    null,
  );
  const [highlightedProduct, setHighlightedProduct] = useState<{
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  } | null>(null);
  const [showHighlightedProduct, setShowHighlightedProduct] = useState(true);

  const { data: participantsData } = trpc.live.participants.useQuery(
    { channelId: Number(liveId) },
    { enabled: !!liveId && joined, refetchInterval: 5000 },
  );
  const viewerCount = participantsData
    ? participantsData.filter((p) => !p.isCurrentUser).length
    : 0;

  const { data: highlightedData } = trpc.live.getHighlightedProduct.useQuery(
    { channelId: Number(liveId) },
    { enabled: !!liveId },
  );

  useEffect(() => {
    if (highlightedData?.product) {
      setHighlightedProduct({
        id: highlightedData.product.id,
        name: highlightedData.product.name,
        price: highlightedData.product.price,
        description: highlightedData.product.description || "",
        imageUrl: highlightedData.product.imageUrl,
      });
    } else {
      setHighlightedProduct(null);
    }
  }, [highlightedData]);

  trpc.live.subscribeToEvents.useSubscription(
    { channelId: Number(liveId) },
    {
      enabled: !!liveId,
      onData: (event) => {
        if (event.type === "PRODUCT_HIGHLIGHTED") {
          setHighlightedProduct({
            id: event.product.id,
            name: event.product.name,
            price: event.product.price,
            description: event.product.description,
            imageUrl: event.product.imageUrl,
          });
          toast.success(
            t("channels.details.productHighlighted", {
              name: event.product.name,
            }),
          );
        } else if (event.type === "PRODUCT_UNHIGHLIGHTED") {
          setHighlightedProduct(null);
          toast.info(t("channels.details.productUnhighlighted"));
        }
      },
      onError: (err) =>
        console.error("Channel events subscription error:", err),
    },
  );

  const leaveMutation = trpc.live.leave.useMutation({
    onSuccess: () => navigate("/lives"),
  });

  const initializeAgora = async (config: ChannelConfig) => {
    try {
      const agoraClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "video") {
          setRemoteUsers((prev) => new Map(prev).set(user.uid as number, user));
        }
        if (mediaType === "audio") user.audioTrack?.play();
      });

      agoraClient.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const next = new Map(prev);
            next.delete(user.uid as number);
            return next;
          });
        }
      });

      agoraClient.on("user-left", (user) => {
        setRemoteUsers((prev) => {
          const next = new Map(prev);
          next.delete(user.uid as number);
          return next;
        });
      });

      let assignedUid;
      let retryCount = 0;
      while (retryCount <= 3) {
        try {
          assignedUid = await agoraClient.join(
            config.appId,
            config.channelName,
            config.token,
            config.uid,
          );
          break;
        } catch (err: unknown) {
          const agoraErr = err as { code?: string };
          if (agoraErr.code === "UID_CONFLICT" && retryCount < 3) {
            retryCount++;
            try {
              await agoraClient.leave();
            } catch {
              /* ignore */
            }
            await new Promise((r) => setTimeout(r, 1000 * retryCount));
          } else {
            throw err;
          }
        }
      }

      if (!assignedUid) throw new Error("Failed to join channel after retries");

      await agoraClient.setClientRole(config.isHost ? "host" : "audience");

      if (config.isHost) {
        const devices = await AgoraRTC.getDevices();
        const cameras = devices.filter((d) => d.kind === "videoinput");
        const microphones = devices.filter((d) => d.kind === "audioinput");

        if (cameras.length === 0 || microphones.length === 0) {
          throw new Error("Missing camera or microphone device");
        }

        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await agoraClient.publish([videoTrack, audioTrack]);

        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);
        localVideoTrackRef.current = videoTrack;
        localAudioTrackRef.current = audioTrack;
      }

      setClient(agoraClient);
      setJoined(true);
      clientRef.current = agoraClient;
    } catch (err: unknown) {
      const agoraErr = err as { code?: string; message?: string };
      if (agoraErr.code === "UID_CONFLICT") return;
      setError(agoraErr.message || "Failed to join channel");
    }
  };

  const joinMutation = trpc.live.join.useMutation({
    onSuccess: async (data) => {
      setLiveStatus(data.liveStatus);
      setLiveMeta(data.live);

      if (data.liveStatus === "active") {
        const config: ChannelConfig = {
          appId: data.appId!,
          token: data.token!,
          channelName: data.channel!.id.toString(),
          uid: data.uid!,
          isHost: data.isHost!,
        };
        setChannelConfig(config);
        await initializeAgora(config);
      } else if (data.liveStatus === "upcoming" && data.live.startsAt) {
        const msUntilStart =
          new Date(data.live.startsAt).getTime() - Date.now();
        setTimeout(
          () => joinMutation.mutate({ channelId: Number(liveId) }),
          Math.max(5000, Math.min(msUntilStart, 60000)),
        );
      }
    },
    onError: (err) => setError(err.message),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (liveId) joinMutation.mutate({ channelId: Number(liveId) });
  }, [liveId]);

  useEffect(() => {
    return () => {
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      screenTrackRef.current?.stop();
      screenTrackRef.current?.close();
      clientRef.current?.leave().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (localVideoTrack && joined) {
      const el = document.getElementById("LiveDetailsPage-video");
      if (el) {
        el.innerHTML = "";
        try {
          localVideoTrack.play("LiveDetailsPage-video");
        } catch {
          /* ignore */
        }
      }
    }
  }, [localVideoTrack, joined]);

  useEffect(() => {
    const firstUser = Array.from(remoteUsers.values()).find(
      (user) => user.videoTrack,
    );
    if (firstUser?.videoTrack) {
      const el = document.getElementById("LiveDetailsPage-video");
      if (el) {
        el.innerHTML = "";
        firstUser.videoTrack.play("LiveDetailsPage-video");
      }
    }
  }, [remoteUsers]);

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!audioMuted);
      setAudioMuted(!audioMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!videoMuted);
      setVideoMuted(!videoMuted);
    }
  };

  const forceLeave = useCallback(() => {
    localVideoTrackRef.current?.stop();
    localVideoTrackRef.current?.close();
    localAudioTrackRef.current?.stop();
    localAudioTrackRef.current?.close();
    screenTrackRef.current?.stop();
    screenTrackRef.current?.close();
    clientRef.current?.leave().catch(() => {});

    setClient(null);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setScreenTrack(null);
    setRemoteUsers(new Map());
    setJoined(false);
    setIsLeaving(false);

    if (liveId) leaveMutation.mutate({ channelId: Number(liveId) });
    navigate("/lives");
  }, [liveId, navigate, leaveMutation]);

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      localVideoTrackRef.current?.stop();
      localVideoTrackRef.current?.close();
      localAudioTrackRef.current?.stop();
      localAudioTrackRef.current?.close();
      screenTrackRef.current?.stop();
      screenTrackRef.current?.close();

      if (clientRef.current) {
        try {
          await Promise.race([
            clientRef.current.leave(),
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error("Leave timeout")), 5000),
            ),
          ]);
        } catch {
          /* timeout — proceed anyway */
        }
        clientRef.current = null;
      }

      setClient(null);
      setLocalVideoTrack(null);
      setLocalAudioTrack(null);
      setScreenTrack(null);
      setRemoteUsers(new Map());
      setJoined(false);
      setIsLeaving(false);

      if (liveId) leaveMutation.mutate({ channelId: Number(liveId) });
      navigate("/lives");
    } catch {
      forceLeave();
    }
  }, [liveId, navigate, leaveMutation, forceLeave]);

  return {
    joined,
    liveStatus,
    liveMeta,
    error,
    client,
    channelConfig,
    audioMuted,
    videoMuted,
    isLeaving,
    viewerCount,
    highlightedProduct,
    showHighlightedProduct,
    setShowHighlightedProduct,
    remoteUsers,
    localVideoTrack,
    handleLeave,
    forceLeave,
    toggleAudio,
    toggleVideo,
  };
};

export const useShop = (liveId: string | undefined) => {
  const utils = trpc.useUtils();
  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts = [] } = trpc.product.list.useQuery(
    { shopId: myShop?.id ?? 0 },
    { enabled: myShop !== undefined },
  );
  const { data: linkedProducts = [] } = trpc.product.listByChannel.useQuery({
    channelId: Number(liveId),
  });

  const highlightMutation = trpc.live.highlightProduct.useMutation({
    onSuccess: () =>
      utils.live.getHighlightedProduct.invalidate({
        channelId: Number(liveId),
      }),
  });

  const unhighlightMutation = trpc.live.unhighlightProduct.useMutation({
    onSuccess: () =>
      utils.live.getHighlightedProduct.invalidate({
        channelId: Number(liveId),
      }),
  });

  const associateMutation = trpc.product.associateToChannel.useMutation({
    onSuccess: () =>
      utils.product.listByChannel.invalidate({ channelId: Number(liveId) }),
  });

  const removeFromChannelMutation = trpc.product.removeFromChannel.useMutation({
    onSuccess: () =>
      utils.product.listByChannel.invalidate({ channelId: Number(liveId) }),
  });

  const highlightProduct = (productId: number) =>
    highlightMutation.mutate({ channelId: Number(liveId), productId });

  const unhighlightProduct = () =>
    unhighlightMutation.mutate({ channelId: Number(liveId) });

  const associateProduct = (productId: number) =>
    associateMutation.mutate({ channelId: Number(liveId), productId });

  const removeProduct = (productId: number) =>
    removeFromChannelMutation.mutate({ channelId: Number(liveId), productId });

  return {
    myShop,
    shopProducts,
    linkedProducts,
    highlightProduct,
    unhighlightProduct,
    associateProduct,
    removeProduct,
  };
};

export const useAuction = (liveId: string | undefined) => {
  const utils = trpc.useUtils();
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);

  const { data: activeAuction } = trpc.auction.getActive.useQuery(
    { channelId: Number(liveId) },
    { enabled: !!liveId, refetchInterval: 3000 },
  );

  useEffect(() => {
    if (!activeAuction?.endsAt) {
      setTimeLeftSeconds(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(activeAuction.endsAt).getTime() - Date.now()) / 1000,
        ),
      );
      setTimeLeftSeconds(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeAuction?.endsAt]);

  const invalidateAuction = () =>
    utils.auction.getActive.invalidate({ channelId: Number(liveId) });

  const startMutation = trpc.auction.start.useMutation({
    onSuccess: () => {
      setIsAuctionModalOpen(false);
      invalidateAuction();
    },
    onError: (err) => toast.error(err.message),
  });

  const closeMutation = trpc.auction.close.useMutation({
    onSuccess: invalidateAuction,
    onError: (err) => toast.error(err.message),
  });

  const bidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: invalidateAuction,
    onError: (err) => toast.error(err.message),
  });

  const buyoutMutation = trpc.auction.buyout.useMutation({
    onSuccess: invalidateAuction,
    onError: (err) => toast.error(err.message),
  });

  const startAuction = async (
    productId: number,
    config: { durationSeconds: 60 | 300 | 600 | 1800; buyoutPrice?: number },
  ) => {
    await startMutation.mutateAsync({ productId, ...config });
  };

  const closeAuction = () => {
    if (activeAuction) closeMutation.mutate({ auctionId: activeAuction.id });
  };

  const placeBid = (amount: number) => {
    if (activeAuction)
      bidMutation.mutate({ auctionId: activeAuction.id, amount });
  };

  const buyout = () => {
    if (activeAuction) buyoutMutation.mutate({ auctionId: activeAuction.id });
  };

  return {
    activeAuction,
    timeLeftSeconds,
    isAuctionModalOpen,
    setIsAuctionModalOpen,
    startAuction,
    closeAuction,
    placeBid,
    buyout,
  };
};

export const useChat = (liveId: string | undefined) => {
  const { t } = useTranslation();
  const [messageList, setMessageList] = useState<
    { id: number; userId: number; content: string }[]
  >([]);
  const [messageInput, setMessageInput] = useState("");

  trpc.message.subscribe.useSubscription(
    { channelId: liveId ? Number(liveId) : 0 },
    {
      onData: (newMessage) => {
        setMessageList((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      },
      onError: (error) => {
        console.error("Subscription error:", error);
        toast.error(t("channels.chat.connectionLost"));
      },
    },
  );

  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: (data) => {
      setMessageList((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    },
    onError: (error) => {
      toast.error(error.message || t("channels.chat.sendError"));
    },
  });

  const onSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (liveId && content) {
      sendMessageMutation.mutate({
        channelId: Number(liveId),
        content,
      });
      setMessageInput("");
    }
  };

  return { messageList, messageInput, setMessageInput, onSubmitMessage };
};

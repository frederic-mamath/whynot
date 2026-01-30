import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export interface ChannelStatus {
  isActive: boolean;
  isLive: boolean;
  relayStatus: string | null;
  hlsPlaybackUrl: string | null;
  recordingUrl: string | null;
}

export function useChannelStatus(channelId: number | undefined) {
  const [status, setStatus] = useState<ChannelStatus | null>(null);

  // Poll status every 5 seconds
  const { data } = trpc.channel.getStatus.useQuery(
    { channelId: channelId! },
    {
      enabled: !!channelId,
      refetchInterval: 5000, // Poll every 5s
      refetchIntervalInBackground: true,
    },
  );

  useEffect(() => {
    if (data) {
      setStatus(data);
    }
  }, [data]);

  return status;
}

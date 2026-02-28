import { useEffect, useState } from 'react';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import { Badge } from '../ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NetworkQualityProps {
  client: IAgoraRTCClient | null;
}

type QualityLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface NetworkStats {
  downlinkQuality: QualityLevel;
  uplinkQuality: QualityLevel;
}

export default function NetworkQuality({ client }: NetworkQualityProps) {
  const [stats, setStats] = useState<NetworkStats>({
    downlinkQuality: 0,
    uplinkQuality: 0,
  });

  useEffect(() => {
    if (!client) return;

    const handleNetworkQuality = (stats: {
      downlinkNetworkQuality: QualityLevel;
      uplinkNetworkQuality: QualityLevel;
    }) => {
      setStats({
        downlinkQuality: stats.downlinkNetworkQuality,
        uplinkQuality: stats.uplinkNetworkQuality,
      });
    };

    client.on('network-quality', handleNetworkQuality);

    return () => {
      client.off('network-quality', handleNetworkQuality);
    };
  }, [client]);

  const getQualityConfig = (quality: QualityLevel) => {
    switch (quality) {
      case 0:
        return { label: 'Unknown', variant: 'secondary' as const, color: 'text-muted-foreground' };
      case 1:
        return { label: 'Excellent', variant: 'default' as const, color: 'text-green-500' };
      case 2:
        return { label: 'Good', variant: 'default' as const, color: 'text-green-500' };
      case 3:
        return { label: 'Fair', variant: 'secondary' as const, color: 'text-yellow-500' };
      case 4:
        return { label: 'Poor', variant: 'destructive' as const, color: 'text-orange-500' };
      case 5:
      case 6:
        return { label: 'Bad', variant: 'destructive' as const, color: 'text-red-500' };
      default:
        return { label: 'Unknown', variant: 'secondary' as const, color: 'text-muted-foreground' };
    }
  };

  if (!client) return null;

  const avgQuality = Math.max(stats.downlinkQuality, stats.uplinkQuality);
  const config = getQualityConfig(avgQuality);
  const isGood = avgQuality <= 2;

  return (
    <Badge variant={config.variant} className="gap-1.5">
      {isGood ? (
        <Wifi className={cn("size-3", config.color)} />
      ) : (
        <WifiOff className={cn("size-3", config.color)} />
      )}
      <span className="text-xs hidden sm:inline">{config.label}</span>
    </Badge>
  );
}

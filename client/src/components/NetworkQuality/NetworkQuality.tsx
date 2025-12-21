import { useEffect, useState } from 'react';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

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

  const getQualityLabel = (quality: QualityLevel): string => {
    switch (quality) {
      case 0:
        return 'Unknown';
      case 1:
        return 'Excellent';
      case 2:
        return 'Good';
      case 3:
        return 'Fair';
      case 4:
        return 'Poor';
      case 5:
      case 6:
        return 'Bad';
      default:
        return 'Unknown';
    }
  };

  const getQualityColor = (quality: QualityLevel): string => {
    switch (quality) {
      case 0:
        return 'bg-gray-500';
      case 1:
      case 2:
        return 'bg-green-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
      case 6:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSignalBars = (quality: QualityLevel): number => {
    switch (quality) {
      case 0:
        return 0;
      case 1:
        return 4;
      case 2:
        return 3;
      case 3:
        return 2;
      case 4:
      case 5:
      case 6:
        return 1;
      default:
        return 0;
    }
  };

  const getBarHeight = (barNumber: number): string => {
    switch (barNumber) {
      case 1:
        return 'h-2';
      case 2:
        return 'h-3';
      case 3:
        return 'h-4';
      case 4:
        return 'h-5';
      default:
        return 'h-2';
    }
  };

  if (!client) return null;

  const avgQuality = Math.max(stats.downlinkQuality, stats.uplinkQuality);
  const bars = getSignalBars(avgQuality);
  const qualityLabel = getQualityLabel(avgQuality);

  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 bg-gray-900/80 text-white rounded-lg backdrop-blur-sm" 
      title={`Network: ${qualityLabel}`}
    >
      <div className="flex items-end gap-1 h-5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-all ${getBarHeight(bar)} ${
              bar <= bars ? getQualityColor(avgQuality) : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium">{qualityLabel}</span>
    </div>
  );
}

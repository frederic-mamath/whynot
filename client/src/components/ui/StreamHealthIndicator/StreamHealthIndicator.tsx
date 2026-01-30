import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Loader2, XCircle } from "lucide-react";

interface StreamHealthIndicatorProps {
  relayStatus: string | null;
  isLive: boolean;
  className?: string;
}

export function StreamHealthIndicator({
  relayStatus,
  isLive,
  className,
}: StreamHealthIndicatorProps) {
  const getStatusConfig = () => {
    if (!relayStatus) {
      return {
        icon: XCircle,
        label: "Not streaming",
        color: "text-gray-500",
      };
    }

    switch (relayStatus) {
      case "starting":
        return {
          icon: Loader2,
          label: "Starting...",
          color: "text-yellow-500",
          animate: true,
        };
      case "active":
        return {
          icon: CheckCircle,
          label: isLive ? "Live" : "Processing...",
          color: isLive ? "text-green-500" : "text-yellow-500",
        };
      case "stopped":
        return {
          icon: XCircle,
          label: "Stream ended",
          color: "text-gray-500",
        };
      case "error":
        return {
          icon: AlertCircle,
          label: "Error",
          color: "text-red-500",
        };
      default:
        return {
          icon: AlertCircle,
          label: "Unknown",
          color: "text-gray-500",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          config.animate && "animate-spin",
        )}
      />
      <span className={cn("text-sm font-medium", config.color)}>
        {config.label}
      </span>
    </div>
  );
}

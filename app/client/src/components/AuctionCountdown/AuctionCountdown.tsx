import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface AuctionCountdownProps {
  endsAt: string;
  isActive: boolean;
  extendedCount: number;
}

export function AuctionCountdown({
  endsAt,
  isActive,
  extendedCount,
}: AuctionCountdownProps) {
  const { t } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(endsAt);
      const remaining = Math.max(0, end.getTime() - now.getTime());
      setTimeRemaining(remaining);
    };

    // Calculate immediately
    calculateTimeRemaining();

    if (!isActive) return;

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [endsAt, isActive]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getUrgencyColor = (): string => {
    if (!isActive || timeRemaining === 0) return "text-muted-foreground";
    if (timeRemaining < 30000) return "text-destructive"; // <30s - red
    if (timeRemaining < 60000) return "text-amber-500"; // <1min - amber
    return "text-foreground"; // Normal
  };

  const isEnded = !isActive || timeRemaining === 0;

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("size-4", getUrgencyColor())} />
      <span
        className={cn("font-mono text-sm", getUrgencyColor())}
        role="timer"
        aria-live="polite"
        aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
      >
        {isEnded ? t("auction.countdown.ended") : formatTime(timeRemaining)}
      </span>
      {extendedCount > 0 && !isEnded && (
        <Badge variant="secondary" className="text-xs">
          +30s × {extendedCount}
        </Badge>
      )}
    </div>
  );
}

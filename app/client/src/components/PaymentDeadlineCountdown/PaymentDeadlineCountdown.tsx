import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface PaymentDeadlineCountdownProps {
  deadline: string;
}

export function PaymentDeadlineCountdown({ deadline }: PaymentDeadlineCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(deadline);
      const remaining = Math.max(0, end.getTime() - now.getTime());
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const formatTime = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUrgencyColor = (): string => {
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    if (hoursRemaining < 24) return "text-destructive";
    if (hoursRemaining < 72) return "text-amber-500";
    return "text-foreground";
  };

  if (timeRemaining === 0) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-destructive" />
        <span className="text-sm text-destructive font-medium">Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("size-4", getUrgencyColor())} />
      <span className={cn("text-sm font-medium", getUrgencyColor())}>
        Pay within: {formatTime(timeRemaining)}
      </span>
    </div>
  );
}

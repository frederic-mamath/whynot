import { useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, Trophy, User } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface Bid {
  id: string;
  bidderUsername: string;
  bidderId: number;
  amount: number;
  placedAt: string;
}

interface BidHistoryProps {
  bids: Bid[];
  currentUserId?: number;
  currentBid: number;
}

export function BidHistory({ bids, currentUserId, currentBid }: BidHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatTimeAgo = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  const isWinningBid = (amount: number) => amount === currentBid;
  const isCurrentUserBid = (bidderId: number) => bidderId === currentUserId;

  if (bids.length === 0) {
    return (
      <div className="mt-4 text-sm text-muted-foreground text-center py-2">
        No bids yet. Be the first!
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-2"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4" />
          <span className="text-sm font-medium">
            Bid History ({bids.length})
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md text-sm",
                isCurrentUserBid(bid.bidderId) && "bg-primary/10",
                isWinningBid(bid.amount) && "bg-amber-50 dark:bg-amber-950"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isWinningBid(bid.amount) && (
                  <Trophy className="size-3 text-amber-500 shrink-0" />
                )}
                {isCurrentUserBid(bid.bidderId) && !isWinningBid(bid.amount) && (
                  <User className="size-3 text-primary shrink-0" />
                )}
                <span className="font-medium truncate">
                  {bid.bidderUsername}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold">${bid.amount.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(bid.placedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

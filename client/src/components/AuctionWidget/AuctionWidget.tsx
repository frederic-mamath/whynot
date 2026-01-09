import { Zap, Sparkles } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { AuctionCountdown } from "../AuctionCountdown";
import { BidInput } from "../BidInput";
import { BidHistory } from "../BidHistory";
import { cn } from "../../lib/utils";

interface AuctionWidgetProps {
  auction: {
    id: string;
    productId: number;
    productName: string;
    productImageUrl: string | null;
    sellerId: number;
    sellerUsername: string;
    channelId: number;
    startingPrice: number;
    buyoutPrice: number | null;
    currentBid: number;
    highestBidderId: number | null;
    highestBidderUsername: string | null;
    durationSeconds: number;
    startedAt: string;
    endsAt: string;
    extendedCount: number;
    status: 'active' | 'ended' | 'paid' | 'cancelled';
    createdAt: string;
  };
  bids: Array<{
    id: string;
    bidderUsername: string;
    bidderId: number;
    amount: number;
    placedAt: string;
  }>;
  currentUserId?: number;
  onPlaceBid: (amount: number) => Promise<void>;
  onBuyout: () => Promise<void>;
  onManualClose?: () => void;
  isHostOrSeller?: boolean;
  isLoading?: boolean;
  isClosing?: boolean;
}

export function AuctionWidget({
  auction,
  bids,
  currentUserId,
  onPlaceBid,
  onBuyout,
  onManualClose,
  isHostOrSeller = false,
  isLoading,
  isClosing = false,
}: AuctionWidgetProps) {
  const isActive = auction.status === 'active';
  const isSeller = currentUserId === auction.sellerId;
  const isEnded = auction.status === 'ended' || auction.status === 'paid';

  if (isLoading) {
    return (
      <Card className="border-2 border-primary shadow-lg">
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="w-20 h-20 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 shadow-lg transition-colors",
      isActive ? "border-primary" : "border-muted"
    )}>
      <CardContent className="p-4">
        {/* Header with product info */}
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
            {auction.productImageUrl ? (
              <img
                src={auction.productImageUrl}
                alt={auction.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="size-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1 flex items-center gap-2">
              <Sparkles className="size-4 text-primary animate-pulse shrink-0" />
              {auction.productName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Starting Price: <span className="font-semibold text-foreground">
                ${auction.startingPrice.toFixed(2)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Seller: {auction.sellerUsername}
            </p>
          </div>
        </div>

        {/* Current Bid & Timer */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Bid:</span>
            <span className="font-bold text-2xl">${auction.currentBid.toFixed(2)}</span>
          </div>

          <AuctionCountdown
            endsAt={auction.endsAt}
            isActive={isActive}
            extendedCount={auction.extendedCount}
          />

          {/* Winner Display (if ended) */}
          {isEnded && auction.highestBidderUsername && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-center">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                🏆 Won by {auction.highestBidderUsername} for ${auction.currentBid.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Buyout Button (if available and active) */}
        {auction.buyoutPrice && isActive && !isSeller && (
          <Button
            onClick={onBuyout}
            className="w-full mt-4"
            variant="default"
            size="lg"
          >
            <Zap className="size-4 mr-2" />
            Buy Now for ${auction.buyoutPrice.toFixed(2)}
          </Button>
        )}

        {/* Bid Input (buyers only, when active) */}
        {isActive && !isSeller && currentUserId && (
          <BidInput
            currentBid={auction.currentBid}
            onPlaceBid={onPlaceBid}
          />
        )}

        {/* Seller Note */}
        {isSeller && isActive && (
          <div className="mt-4 text-sm text-muted-foreground text-center py-2 bg-muted/50 rounded-md">
            You cannot bid on your own auction
          </div>
        )}

        {/* Login Prompt */}
        {isActive && !currentUserId && (
          <div className="mt-4 text-sm text-muted-foreground text-center py-2 bg-muted/50 rounded-md">
            Log in to place bids
          </div>
        )}

        {/* Bid History */}
        <BidHistory
          bids={bids}
          currentUserId={currentUserId}
          currentBid={auction.currentBid}
        />

        {/* Manual Close Button (Host/Seller only) */}
        {isActive && isHostOrSeller && onManualClose && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onManualClose}
              disabled={isClosing}
              className="w-full text-destructive hover:bg-destructive/10"
            >
              {isClosing ? 'Ending Auction...' : 'End Auction Early'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

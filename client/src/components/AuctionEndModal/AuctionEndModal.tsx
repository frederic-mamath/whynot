import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, DollarSign, Users, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface AuctionEndModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productImage?: string | null;
  finalBid: number;
  winnerUsername: string;
  totalBids: number;
  isWinner: boolean;
  isParticipant: boolean;
}

export function AuctionEndModal({
  open,
  onOpenChange,
  productName,
  productImage,
  finalBid,
  winnerUsername,
  totalBids,
  isWinner,
  isParticipant
}: AuctionEndModalProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!open) {
      setCountdown(10);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onOpenChange(false);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onOpenChange]);

  const handleViewOrders = () => {
    onOpenChange(false);
    navigate('/my-orders');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className={isWinner ? "text-yellow-500" : "text-muted-foreground"} />
            {isWinner ? "🎉 You Won!" : "Auction Ended"}
          </DialogTitle>
          <DialogDescription>
            {isWinner 
              ? "Congratulations! You won the auction."
              : isParticipant
              ? "Better luck next time!"
              : "The auction has ended."}
          </DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        <div className="flex gap-4 py-4">
          {productImage ? (
            <img 
              src={productImage} 
              alt={productName}
              className="w-20 h-20 object-cover rounded-md"
            />
          ) : (
            <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
              <Sparkles className="size-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{productName}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <DollarSign className="w-4 h-4" />
              <span>Winning bid: ${finalBid.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Users className="w-4 h-4" />
              <span>{totalBids} bid{totalBids !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Winner Info */}
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm">
            <span className="text-muted-foreground">Winner: </span>
            <span className="font-semibold">{winnerUsername}</span>
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isWinner ? (
            <>
              <Button onClick={handleViewOrders} className="w-full sm:w-auto">
                View My Orders
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Close ({countdown}s)
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close ({countdown}s)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

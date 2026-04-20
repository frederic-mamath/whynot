import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";
import { Trophy, DollarSign, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
  isParticipant,
}: AuctionEndModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    navigate("/my-orders");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy
              className={isWinner ? "text-primary" : "text-muted-foreground"}
            />
            {isWinner ? t("auction.end.youWon") : t("auction.end.ended")}
          </DialogTitle>
          <DialogDescription>
            {isWinner
              ? t("auction.end.congratulations")
              : isParticipant
                ? t("auction.end.betterLuck")
                : t("auction.end.auctionEnded")}
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
              <span>
                {t("auction.end.winningBid", { price: finalBid.toFixed(2) })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Users className="w-4 h-4" />
              <span>{t("auction.end.bids", { count: totalBids })}</span>
            </div>
          </div>
        </div>

        {/* Winner Info */}
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm">
            <span className="text-muted-foreground">
              {t("auction.end.winner")}{" "}
            </span>
            <span className="font-semibold">{winnerUsername}</span>
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isWinner ? (
            <>
              <ButtonV2
                label={t("auction.end.viewOrders")}
                onClick={handleViewOrders}
                className="bg-primary text-primary-foreground w-full sm:w-auto"
              />
              <ButtonV2
                label={t("auction.end.close", { s: countdown })}
                onClick={handleClose}
                className="border border-border bg-background text-foreground w-full sm:w-auto"
              />
            </>
          ) : (
            <ButtonV2
              label={t("auction.end.close", { s: countdown })}
              onClick={handleClose}
              className="border border-border bg-background text-foreground w-full"
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Clock, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "../../lib/utils";

interface AuctionConfigModalProps {
  productId: number;
  productName: string;
  startingPrice: number;
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: { durationSeconds: number; buyoutPrice?: number }) => Promise<void>;
}

const DURATION_OPTIONS = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 600, label: "10 minutes" },
  { value: 1800, label: "30 minutes" },
];

export function AuctionConfigModal({
  productId,
  productName,
  startingPrice,
  isOpen,
  onClose,
  onStart,
}: AuctionConfigModalProps) {
  const [durationSeconds, setDurationSeconds] = useState<number>(300); // Default 5 min
  const [buyoutPrice, setBuyoutPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate buyout price if provided
    if (buyoutPrice) {
      const buyoutNum = parseFloat(buyoutPrice);
      if (isNaN(buyoutNum) || buyoutNum <= startingPrice) {
        setError(`Buyout price must be greater than $${startingPrice.toFixed(2)}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onStart({
        durationSeconds,
        buyoutPrice: buyoutPrice ? parseFloat(buyoutPrice) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start auction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Auction</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Starting Price Display */}
          <div>
            <Label className="text-sm text-muted-foreground">Starting Price</Label>
            <p className="text-2xl font-bold">${startingPrice.toFixed(2)}</p>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="size-4" />
              Duration
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDurationSeconds(option.value)}
                  className={cn(
                    "px-4 py-3 rounded-md border-2 text-sm font-medium transition-colors",
                    durationSeconds === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-accent"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buyout Price (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="buyout-price" className="flex items-center gap-2">
              <Zap className="size-4" />
              Buyout Price (Optional)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="buyout-price"
                type="number"
                step="0.01"
                min={startingPrice + 0.01}
                value={buyoutPrice}
                onChange={(e) => setBuyoutPrice(e.target.value)}
                placeholder={(startingPrice + 10).toFixed(2)}
                className="pl-6"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Buyers can purchase instantly at this price
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Starting..." : "Start Auction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { X, Clock, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Start Auction</h2>
            <p className="text-sm text-muted-foreground">{productName}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
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

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Starting..." : "Start Auction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

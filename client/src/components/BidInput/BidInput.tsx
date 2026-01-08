import { useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";

interface BidInputProps {
  currentBid: number;
  onPlaceBid: (amount: number) => Promise<void>;
  disabled?: boolean;
}

export function BidInput({ currentBid, onPlaceBid, disabled }: BidInputProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minBid = currentBid + 1;

  const validateBid = (amount: string): boolean => {
    setError("");

    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      setError("Please enter a valid amount");
      return false;
    }

    if (numAmount < minBid) {
      setError(`Minimum bid is $${minBid.toFixed(2)}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBid(bidAmount)) return;

    setIsSubmitting(true);
    try {
      await onPlaceBid(parseFloat(bidAmount));
      setBidAmount(""); // Clear input on success
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to place bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <Label htmlFor="bid-amount" className="text-sm">
        Next Minimum Bid: <span className="font-semibold">${minBid.toFixed(2)}</span>
      </Label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="bid-amount"
            type="number"
            step="0.01"
            min={minBid}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={minBid.toFixed(2)}
            className={cn("pl-6", error && "border-destructive")}
            disabled={disabled || isSubmitting}
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !bidAmount}
          className="shrink-0"
        >
          {isSubmitting ? (
            "Placing..."
          ) : (
            <>
              <TrendingUp className="size-4 mr-2" />
              Place Bid
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  newBid: number;
  onDismiss: () => void;
  onBidAgain: () => void;
};

export function OutbidBanner({ productName, newBid, onDismiss, onBidAgain }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        "bg-warning/15 border border-warning/40 rounded-xl",
        "px-4 py-3 mb-3",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warning font-outfit leading-tight">
          Tu as été surenchéri(e) !
        </p>
        <p className="text-xs text-warning/80 font-outfit truncate">
          {productName} — enchère actuelle : {newBid.toFixed(2)} €
        </p>
      </div>
      <button
        onClick={onBidAgain}
        className="shrink-0 px-3 py-1.5 rounded-lg bg-warning text-warning-foreground text-xs font-semibold font-outfit whitespace-nowrap"
      >
        Surenchérir
      </button>
      <button onClick={onDismiss} className="shrink-0 text-warning/60 hover:text-warning transition-colors">
        <X className="size-4" />
      </button>
    </div>
  );
}

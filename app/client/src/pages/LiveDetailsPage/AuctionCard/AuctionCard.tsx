import { cn } from "@/lib/utils";
import { Timer, Trophy } from "lucide-react";

interface Props {
  winnerNickname: string | null;
  currentPrice: number;
  timeLeftSeconds: number;
}

const AuctionCard = ({
  winnerNickname,
  currentPrice,
  timeLeftSeconds,
}: Props) => {
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        "rounded-md",
        "bg-black/60",
        "px-3 py-2",
        "text-white text-sm",
        "mt-2",
      )}
    >
      <div className={cn("flex items-center gap-1")}>
        <Trophy size={14} />
        <span>{winnerNickname ?? "Aucun enchérisseur"}</span>
      </div>
      <div className={cn("font-bold")}>{currentPrice}€</div>
      <div className={cn("flex items-center gap-1")}>
        <Timer size={14} />
        <span>
          {minutes}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
};

export default AuctionCard;

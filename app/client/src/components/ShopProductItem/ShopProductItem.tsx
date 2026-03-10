import { cn } from "@/lib/utils";
import { Pencil, Trash } from "lucide-react";
import IconButton from "../ui/IconButton/IconButton";

interface Props {
  id: number;
  name: string;
  desiredPrice: number | null;
  startingPrice?: number | null;
  pictureUrl?: string | null;
  isAssociatedToALive?: boolean;
}

const ShopProductItem = ({
  id,
  name,
  desiredPrice,
  startingPrice,
  pictureUrl,
  isAssociatedToALive,
}: Props) => {
  return (
    <div
      className={cn(
        "flex items-center",
        "background-b-fourth",
        "border-1 border-divider rounded-[12px]",
        "p-3 gap-3",
      )}
    >
      <div
        className={cn("h-[44px] w-[44px]", "rounded-[10px]", "overflow-hidden")}
      >
        {pictureUrl && (
          <img
            className={cn("h-full w-full object-cover")}
            src={pictureUrl}
            alt={name}
          />
        )}
      </div>
      <div className="flex-1">
        <div className={cn("text-foreground font-semibold text-[11px]")}>
          {name}
        </div>
        <div className={cn("text-primary font-bold text-[12px]")}>
          {desiredPrice}€
        </div>
        <div className={cn("text-muted text-[8px]")}>
          Depart: {startingPrice}€
          {isAssociatedToALive ? " · Associé au live" : ""}
        </div>
      </div>
      <div className={cn("flex", "gap-2")}>
        <IconButton
          icon={<Pencil size={12} />}
          onClick={() => {
            console.log({ id });
          }}
          size={28}
        />
        <IconButton
          icon={<Trash size={12} />}
          onClick={() => {
            console.log({ id });
          }}
          size={28}
        />
      </div>
    </div>
  );
};

export default ShopProductItem;

import ButtonV2 from "@/components/ui/ButtonV2";
import { cn } from "@/lib/utils";

type Variant = "buyer" | "host-boutique" | "host-inventaire";

interface Props {
  id: number;
  name: string;
  imageUrl: string | null;
  wishedPrice: number | null;
  variant?: Variant;
  isHighlighted?: boolean;
  onHighlight?: () => void;
  onUnhighlight?: () => void;
  onAssociate?: () => void;
}

const ProductCard = ({
  name,
  imageUrl,
  wishedPrice,
  variant = "buyer",
  isHighlighted = false,
  onHighlight,
  onUnhighlight,
  onAssociate,
}: Props) => {
  return (
    <div
      className={cn(
        "flex",
        "border-1 border-divider rounded-sm",
        "p-3",
        "gap-3",
      )}
    >
      <div className={cn("h-32 w-32", "bg-muted", "flex-shrink-0")}>
        {imageUrl && (
          <img
            className={cn("h-full w-full object-cover")}
            src={imageUrl}
            alt={name}
          />
        )}
      </div>
      <div className={cn("flex flex-col")}>
        <div className={cn("flex-1")}>
          <div className={cn("text-md")}>{name}</div>
          <div className={cn("text-sm")}>{wishedPrice}€</div>
        </div>
        {variant === "buyer" && (
          <ButtonV2
            className={cn("bg-primary", "text-primary-foreground", "px-4")}
            label="Enregistrer et me prévenir"
            onClick={() => {}}
          />
        )}
        {variant === "host-boutique" && (
          <ButtonV2
            className={cn(
              isHighlighted ? "bg-destructive" : "bg-primary",
              "text-primary-foreground",
              "px-4",
            )}
            label={
              isHighlighted ? "Retirer de la mise en avant" : "Mettre en avant"
            }
            onClick={isHighlighted ? onUnhighlight : onHighlight}
          />
        )}
        {variant === "host-inventaire" && (
          <ButtonV2
            className={cn("bg-primary", "text-primary-foreground", "px-4")}
            label="Associer au live"
            onClick={onAssociate}
          />
        )}
      </div>
    </div>
  );
};

export default ProductCard;

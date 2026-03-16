import ButtonV2 from "@/components/ui/ButtonV2";
import { cn } from "@/lib/utils";

interface Props {
  id: number;
  name: string;
  imageUrl: string | null;
  wishedPrice: number | null;
  onClick: () => void;
}

const ProductCard = ({ id, name, imageUrl, wishedPrice, onClick }: Props) => {
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
        <ButtonV2
          className={cn("bg-primary", "text-primary-foreground", "px-4")}
          label="Enregistrer et me prévenir"
          onClick={onClick}
        />
      </div>
    </div>
  );
};

export default ProductCard;

import { cn } from "@/lib/utils";
import ProductCard from "../ProductCard/ProductCard";

type Variant = "buyer" | "host-boutique" | "host-inventaire";

interface Props {
  products: {
    id: number;
    name: string;
    imageUrl: string | null;
    wishedPrice: number | null;
  }[];
  variant?: Variant;
  highlightedProductId?: number | null;
  onHighlight?: (productId: number) => void;
  onUnhighlight?: () => void;
  onAssociate?: (productId: number) => void;
}

const ProductList = ({
  products,
  variant = "buyer",
  highlightedProductId,
  onHighlight,
  onUnhighlight,
  onAssociate,
}: Props) => {
  return (
    <div className={cn("flex flex-col", "gap-2")}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          imageUrl={product.imageUrl}
          wishedPrice={product.wishedPrice}
          variant={variant}
          isHighlighted={highlightedProductId === product.id}
          onHighlight={() => onHighlight?.(product.id)}
          onUnhighlight={onUnhighlight}
          onAssociate={() => onAssociate?.(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductList;

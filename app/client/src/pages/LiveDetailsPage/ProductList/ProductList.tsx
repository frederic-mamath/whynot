import { cn } from "@/lib/utils";
import ProductCard from "../ProductCard/ProductCard";

interface Props {
  products: {
    id: number;
    name: string;
    imageUrl: string | null;
    wishedPrice: number | null;
  }[];
}

const ProductList = ({ products }: Props) => {
  return (
    <div className={cn("flex flex-col", "gap-2")}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          imageUrl={product.imageUrl}
          wishedPrice={product.wishedPrice}
          onClick={() => {}}
        />
      ))}
    </div>
  );
};

export default ProductList;

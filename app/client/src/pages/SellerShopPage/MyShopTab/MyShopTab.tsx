import ShopProductItem from "@/components/ShopProductItem/ShopProductItem";
import { cn } from "@/lib/utils";

interface Props {
  products: Array<{
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    startingPrice: number | null;
    wishedPrice: number | null;
  }>;
}

const MyShopTab = ({ products }: Props) => {
  return (
    <div>
      <div className={cn("flex items-center justify-between", "mb-4")}>
        <div>Mes produits</div>
        <div>{products.length} produits</div>
      </div>
      <div className={cn("flex", "flex-col", "gap-2")}>
        {products.map((product) => (
          <ShopProductItem
            key={`MyShopTab-ShopProductItem-${product.id}`}
            id={product.id}
            name={product.name}
            desiredPrice={product.wishedPrice}
            startingPrice={product.startingPrice}
            pictureUrl={product.imageUrl}
            isAssociatedToALive={false}
          />
        ))}
      </div>
    </div>
  );
};

export default MyShopTab;

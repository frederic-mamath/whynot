import ShopProductItem from "@/components/ShopProductItem/ShopProductItem";
import ButtonV2 from "@/components/ui/ButtonV2";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

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
  onClickAddProduct: () => void;
}

const MyShopTab = ({ products, onClickAddProduct }: Props) => {
  return (
    <div>
      <div className={cn("flex items-center justify-between", "mb-4")}>
        <div className="text-muted text-[9px]">Mes produits</div>
        <div className="text-primary text-[9px]">
          {products.length} produits
        </div>
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
        <ButtonV2
          className={cn(
            "border-2 border-dashed border-primary rounded-[12px]",
            "text-primary text-[11px] font-bold",
          )}
          icon={<Plus size={12} />}
          label="Ajouter un produit"
          onClick={onClickAddProduct}
        />
      </div>
    </div>
  );
};

export default MyShopTab;

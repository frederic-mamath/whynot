import ShopProductItem from "@/components/ShopProductItem/ShopProductItem";

interface Props {
  shopId: number;
  products: Array<{
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    startingPrice: number | null;
    wishedPrice: number | null;
  }>;
}

const MyShopTab = ({ shopId, products }: Props) => {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {products.map((product) => (
        <ShopProductItem
          key={`MyShopTab-ShopProductItem-${product.id}`}
          id={product.id}
          shopId={shopId}
          name={product.name}
          description={product.description}
          pictureUrl={product.imageUrl}
        />
      ))}
    </div>
  );
};

export default MyShopTab;

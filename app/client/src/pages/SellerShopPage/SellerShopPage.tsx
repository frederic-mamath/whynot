import { useState } from "react";
import {
  Plus,
  Package,
  ChevronRight,
  Cog,
  User,
  CircleDot,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { cn } from "@/lib/utils";
import ProductForm from "./ProductForm";
import ButtonV2 from "@/components/ui/ButtonV2";
import Tabs from "@/components/ui/Tabs";
import MyShopTab from "./MyShopTab/MyShopTab";

const SellerShopPage = () => {
  const [activeTabId, setActiveTabId] = useState<string>("boutique");

  const { data: shop, isLoading: shopLoading } = trpc.shop.getMyShop.useQuery();

  const {
    data: products,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = trpc.product.list.useQuery(
    { shopId: shop?.id ?? 0 },
    { enabled: !!shop?.id },
  );

  if (shopLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-outfit text-sm">
          Chargement...
        </p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <Package className="w-12 h-12 text-muted-foreground" />
        <h1 className="font-syne font-extrabold text-xl text-foreground">
          Pas encore de boutique
        </h1>
        <p className="text-muted-foreground text-sm text-center font-outfit">
          Crée ta boutique pour commencer à vendre.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", "mb-6")}>
        <User />
        <h1 className="font-syne font-extrabold text-2xl text-foreground">
          Ma boutique
        </h1>
        <button>
          <Cog />
        </button>
      </div>
      <div>
        <ButtonV2
          label="Passer en live"
          className={cn("w-full", "bg-b-third text-txt-third", "mb-4")}
          icon={<CircleDot />}
        />
      </div>

      {/* Tabs */}
      <Tabs
        className="mb-3"
        items={[
          { id: "boutique", label: "Boutique" },
          { id: "add-product", label: "+Produit" },
        ]}
        selectedTabId={activeTabId}
        onClickItem={(tabId) => setActiveTabId(tabId)}
      />

      {/* Tab content */}
      {activeTabId === "boutique" && (
        <MyShopTab
          products={products ?? []}
          onClickAddProduct={() => setActiveTabId("add-product")}
        />
      )}

      {activeTabId === "add-product" && (
        <ProductForm
          shopId={shop.id}
          onSuccess={() => {
            refetchProducts();
            setActiveTabId("boutique");
          }}
        />
      )}
    </div>
  );
};

function BoutiqueTab({
  products,
  isLoading,
  onAddProduct,
  onEditProduct,
}: {
  products: Array<{
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    imageUrl: string | null;
    startingPrice: number | null;
    wishedPrice: number | null;
  }>;
  isLoading: boolean;
  onAddProduct: () => void;
  onEditProduct: (productId: number) => void;
}) {
  if (isLoading) {
    return (
      <p className="text-muted-foreground font-outfit text-sm">
        Chargement des produits...
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add product button */}
      <button
        onClick={onAddProduct}
        className="w-full border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-8 h-8" />
        <span className="font-outfit text-sm font-medium">
          Ajouter un produit
        </span>
      </button>

      {/* Product list */}
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onEditProduct(product.id)}
          className="w-full bg-card rounded-2xl border border-border p-3 flex items-center gap-3 text-left hover:border-primary/50 transition-colors"
        >
          {/* Product image */}
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-outfit font-semibold text-sm text-foreground truncate">
              {product.name}
            </h3>
            {product.description && (
              <p className="font-outfit text-xs text-muted-foreground truncate">
                {product.description}
              </p>
            )}
            <div className="flex gap-2 mt-1">
              {product.startingPrice != null && (
                <span className="font-outfit text-xs text-muted-foreground">
                  Départ: {product.startingPrice}€
                </span>
              )}
              {product.wishedPrice != null && (
                <span className="font-outfit text-xs text-primary font-medium">
                  Souhaité: {product.wishedPrice}€
                </span>
              )}
              {product.price != null &&
                product.startingPrice == null &&
                product.wishedPrice == null && (
                  <span className="font-outfit text-xs text-foreground font-medium">
                    {product.price}€
                  </span>
                )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      ))}

      {products.length === 0 && (
        <p className="text-center text-muted-foreground text-sm font-outfit py-8">
          Aucun produit pour le moment
        </p>
      )}
    </div>
  );
}

export default SellerShopPage;

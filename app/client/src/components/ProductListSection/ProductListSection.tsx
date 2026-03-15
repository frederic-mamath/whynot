import { ShoppingBag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ButtonV2 from "@/components/ui/ButtonV2";

interface Product {
  id: number;
  name: string;
  imageUrl: string | null;
  startingPrice?: number | null;
}

interface ProductListSectionProps {
  products: Product[];
  selectedProductIds: number[];
  onToggleProduct: (id: number) => void;
  onSetSelectedProducts: (ids: number[]) => void;
  shopExists: boolean;
  onNavigateToShop: () => void;
  onNavigateToCreateProduct: () => void;
}

export default function ProductListSection({
  products,
  selectedProductIds,
  onToggleProduct,
  onSetSelectedProducts,
  shopExists,
  onNavigateToShop,
  onNavigateToCreateProduct,
}: ProductListSectionProps) {
  if (!shopExists) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
        <ShoppingBag className="w-7 h-7" />
        <p className="text-sm">
          Crée ta boutique avant d'associer des produits.
        </p>
        <ButtonV2
          type="button"
          label="Créer ma boutique"
          className="text-xs"
          onClick={onNavigateToShop}
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
        <ShoppingBag className="w-7 h-7" />
        <p className="text-sm">
          Ajoute des produits à ta boutique pour les lier à ce live.
        </p>
        <ButtonV2
          type="button"
          label="Créer un produit"
          className="text-xs"
          onClick={onNavigateToCreateProduct}
        />
      </div>
    );
  }

  const allSelected = selectedProductIds.length === products.length;

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-outfit font-black tracking-widest uppercase text-muted-foreground">
          Associer des produits
        </span>
        <button
          type="button"
          className="text-sm font-outfit font-semibold text-primary"
          onClick={() => {
            if (allSelected) {
              onSetSelectedProducts([]);
            } else {
              onSetSelectedProducts(products.map((p) => p.id));
            }
          }}
        >
          {allSelected ? "Tout décocher" : "Sélectionner"}
        </button>
      </div>

      {/* Product cards */}
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <label
            key={product.id}
            className="flex items-center gap-4 p-4 rounded-2xl bg-b-fourth cursor-pointer"
          >
            <Checkbox
              checked={selectedProductIds.includes(product.id)}
              onCheckedChange={() => onToggleProduct(product.id)}
              className="size-6 rounded-md border-2 border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
            />
            <div className="size-12 rounded-xl bg-muted shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-syne font-bold text-[15px] text-foreground truncate">
                {product.name}
              </span>
              {product.startingPrice != null && (
                <span className="font-outfit font-bold text-primary text-sm">
                  Départ : {Math.round(product.startingPrice)}€
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    </>
  );
}

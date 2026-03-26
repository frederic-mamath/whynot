import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronLeft } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { cn } from "@/lib/utils";
import MyShopTab from "./MyShopTab/MyShopTab";
import CreateProductDialog from "./CreateProductDialog";

const SellerShopPage = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: shop, isLoading } = trpc.shop.getOrCreateMyShop.useQuery();

  const { data: products, refetch: refetchProducts } =
    trpc.product.list.useQuery(
      { shopId: shop?.id ?? 0 },
      { enabled: !!shop?.id },
    );

  if (isLoading || !shop) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground font-outfit text-sm">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className={cn("flex items-center gap-3", "mb-2")}>
        <button
          onClick={() => navigate("/seller")}
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-syne font-extrabold text-2xl text-foreground">
          Inventaire
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted mb-5 leading-relaxed">
        Gérez votre liste de produits, des stocks et préparez la prochaine
        collection pour votre prochain live
      </p>

      {/* Inline add button */}
      <button
        onClick={() => setDialogOpen(true)}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "border border-border rounded-2xl py-3",
          "text-sm font-outfit font-medium text-foreground",
          "hover:border-primary/50 hover:text-primary transition-colors",
          "mb-2",
        )}
      >
        <Plus className="w-4 h-4" />
        ajouter un nouveau produit
      </button>

      <MyShopTab products={products ?? []} />

      <CreateProductDialog
        shopId={shop.id}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          refetchProducts();
        }}
      />
    </div>
  );
};

export default SellerShopPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronLeft, CircleDot } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { cn } from "@/lib/utils";
import ButtonV2 from "@/components/ui/ButtonV2";
import MyShopTab from "./MyShopTab/MyShopTab";
import CreateProductDialog from "./CreateProductDialog";

const SellerShopPage = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: shop, isLoading } = trpc.shop.getOrCreateMyShop.useQuery();

  const {
    data: products,
    refetch: refetchProducts,
  } = trpc.product.list.useQuery(
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
    <div className="px-4 pt-6">
      {/* Header */}
      <div className={cn("flex items-center gap-3", "mb-6")}>
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
      <div>
        <ButtonV2
          label="Passer en live"
          className={cn("w-full", "bg-b-third text-txt-third", "mb-4")}
          icon={<CircleDot />}
        />
      </div>

      <MyShopTab products={products ?? []} />

      {/* FAB */}
      <button
        onClick={() => setDialogOpen(true)}
        className={cn(
          "fixed bottom-24 right-4 z-40",
          "w-14 h-14 rounded-full",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "shadow-lg",
        )}
      >
        <Plus className="w-6 h-6" />
      </button>

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

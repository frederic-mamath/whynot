import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { Store } from "lucide-react";
import Button from "../ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ProductListSection from "@/components/ProductListSection";

interface ShopPanelProps {
  channelId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShopPanel({
  channelId,
  isOpen,
  onClose,
}: ShopPanelProps) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const shopId = myShop?.id;

  const { data: shopProducts = [], isLoading: isLoadingProducts } =
    trpc.product.list.useQuery(
      { shopId: shopId ?? 0 },
      { enabled: shopId !== undefined && isOpen },
    );

  const { data: linkedProducts = [], isLoading: isLoadingLinked } =
    trpc.product.listByChannel.useQuery({ channelId }, { enabled: isOpen });

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Initialise la sélection depuis les produits déjà liés au live
  useEffect(() => {
    if (isOpen && linkedProducts.length >= 0) {
      setSelectedProductIds(linkedProducts.map((p) => p.id));
    }
  }, [isOpen, linkedProducts]);

  const associateMutation = trpc.product.associateToChannel.useMutation();
  const removeMutation = trpc.product.removeFromChannel.useMutation();

  const isLoading = isLoadingProducts || isLoadingLinked;
  const isPending = associateMutation.isPending || removeMutation.isPending;

  const originalIds = new Set(linkedProducts.map((p) => p.id));
  const hasChanges =
    selectedProductIds.some((id) => !originalIds.has(id)) ||
    linkedProducts.some((p) => !selectedProductIds.includes(p.id));

  async function handleConfirm() {
    const newIds = new Set(selectedProductIds);
    const toAdd = selectedProductIds.filter((id) => !originalIds.has(id));
    const toRemove = linkedProducts
      .filter((p) => !newIds.has(p.id))
      .map((p) => p.id);

    try {
      await Promise.all([
        ...toAdd.map((productId) =>
          associateMutation.mutateAsync({ productId, channelId }),
        ),
        ...toRemove.map((productId) =>
          removeMutation.mutateAsync({ productId, channelId }),
        ),
      ]);

      await utils.product.listByChannel.invalidate({ channelId });
      toast.success("Produits mis à jour");
      onClose();
    } catch {
      toast.error("Une erreur est survenue");
    }
  }

  function toggleProduct(id: number) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Store className="size-5" />
            Ma boutique
          </SheetTitle>
          <SheetDescription>
            {isLoading
              ? "Chargement des produits…"
              : `${shopProducts.length} produit${shopProducts.length !== 1 ? "s" : ""} dans ta boutique`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6 flex flex-col gap-3">
          <ProductListSection
            products={shopProducts}
            selectedProductIds={selectedProductIds}
            onToggleProduct={toggleProduct}
            onSetSelectedProducts={setSelectedProductIds}
            shopExists={!!myShop}
            onNavigateToShop={() => navigate("/seller/shop")}
            onNavigateToCreateProduct={() =>
              navigate("/seller/shop/products/create")
            }
          />
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            variant="default"
            className="w-full"
            onClick={handleConfirm}
            disabled={!hasChanges || isPending}
          >
            {isPending ? "Enregistrement…" : "Confirmer"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

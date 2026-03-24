import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { Badge } from "../ui/badge";
import { Package, ShoppingBag, Sparkles, X } from "lucide-react";
import ButtonV2 from "../ui/ButtonV2/ButtonV2";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface PromotedProductsProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  channelId: number;
  canHighlight?: boolean;
  highlightedProductId?: number | null;
}

export default function PromotedProducts({
  products,
  isOpen,
  onClose,
  channelId,
  canHighlight = false,
  highlightedProductId = null,
}: PromotedProductsProps) {
  const activeProducts = products.filter((p) => p.isActive);
  const { t } = useTranslation();

  const highlightMutation = trpc.live.highlightProduct.useMutation({
    onSuccess: () => {
      toast.success(t("promotedProducts.highlighted"));
    },
    onError: (error) => {
      toast.error(error.message || t("promotedProducts.errorHighlight"));
    },
  });

  const unhighlightMutation = trpc.live.unhighlightProduct.useMutation({
    onSuccess: () => {
      toast.success(t("promotedProducts.unhighlighted"));
    },
    onError: (error) => {
      toast.error(error.message || t("promotedProducts.errorUnhighlight"));
    },
  });

  const handleHighlight = (productId: number) => {
    highlightMutation.mutate({ channelId, productId });
  };

  const handleUnhighlight = () => {
    unhighlightMutation.mutate({ channelId });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            {t("promotedProducts.title", { count: activeProducts.length })}
          </SheetTitle>
          <SheetDescription>
            {activeProducts.length === 0
              ? t("promotedProducts.emptyState")
              : t("promotedProducts.nProductsAvailable", {
                  count: activeProducts.length,
                })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {activeProducts.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-lg bg-accent/30 border border-dashed border-border">
              <ShoppingBag className="size-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">
                {t("promotedProducts.emptyState")}
              </p>
              <span className="text-xs text-muted-foreground">
                {t("promotedProducts.emptyStateDesc")}
              </span>
            </div>
          ) : (
            activeProducts.map((product) => {
              const formattedPrice = product.price
                ? `$${product.price.toFixed(2)}`
                : t("promotedProducts.priceNotSet");

              return (
                <div
                  key={product.id}
                  className="rounded-lg border border-border overflow-hidden hover:bg-accent/30 transition-colors"
                >
                  {/* Product Image */}
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                        {product.name}
                      </h3>
                      <Badge variant="default" className="text-xs shrink-0">
                        {formattedPrice}
                      </Badge>
                    </div>

                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {product.description}
                      </p>
                    )}

                    {/* Highlight Controls (SELLER only) */}
                    {canHighlight && (
                      <div className="flex items-center gap-2 mt-2">
                        {highlightedProductId === product.id ? (
                          <ButtonV2
                            icon={<X className="size-3" />}
                            label={t("promotedProducts.unhighlight")}
                            onClick={handleUnhighlight}
                            disabled={unhighlightMutation.isPending}
                            className="w-full h-7 text-xs border border-border bg-background text-foreground"
                          />
                        ) : (
                          <ButtonV2
                            icon={<Sparkles className="size-3" />}
                            label={t("promotedProducts.highlight")}
                            onClick={() => handleHighlight(product.id)}
                            disabled={highlightMutation.isPending}
                            className="w-full h-7 text-xs bg-primary text-primary-foreground"
                          />
                        )}
                      </div>
                    )}

                    {/* Highlighted Badge (visible to all) */}
                    {highlightedProductId === product.id && !canHighlight && (
                      <Badge variant="secondary" className="text-xs mt-2">
                        <Sparkles className="size-3 mr-1" />
                        {t("promotedProducts.currentlyHighlighted")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Package, ShoppingBag } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface PromotedProductsProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export default function PromotedProducts({
  products,
  isOpen,
  onClose,
}: PromotedProductsProps) {
  const activeProducts = products.filter((p) => p.isActive);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            Promoted Products ({activeProducts.length})
          </SheetTitle>
          <SheetDescription>
            {activeProducts.length === 0
              ? 'No products are being promoted'
              : `${activeProducts.length} product${activeProducts.length === 1 ? '' : 's'} available`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {activeProducts.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-lg bg-accent/30 border border-dashed border-border">
              <ShoppingBag className="size-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">No promoted products</p>
              <span className="text-xs text-muted-foreground">
                The host hasn't promoted any products yet
              </span>
            </div>
          ) : (
            activeProducts.map((product) => {
              const formattedPrice = product.price
                ? `$${parseFloat(product.price).toFixed(2)}`
                : 'Price not set';

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
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
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

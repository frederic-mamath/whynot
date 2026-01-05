# Phase 4: Frontend - SELLER Controls

**Status**: 🔲 Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 1 (tRPC endpoints), Phase 2 (WebSocket), Phase 3 (UI component)

---

## Objective

Enable SELLER hosts to highlight/unhighlight products from the Promoted Products panel with visual feedback.

---

## Files to Modify

- `client/src/components/PromotedProducts/PromotedProducts.tsx`

---

## Steps

### Step 1: Update `PromotedProducts` Props (10 min)

Add props to track current highlight and allow control:

```typescript
interface PromotedProductsProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: 'SELLER' | 'BUYER'; // NEW
  highlightedProductId?: number | null; // NEW
  onHighlight?: (productId: number) => void; // NEW
  onUnhighlight?: () => void; // NEW
}
```

---

### Step 2: Add tRPC Mutations (20 min)

In the component, add tRPC mutation hooks:

```tsx
import { trpc } from '@/lib/trpc';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function PromotedProducts({
  products,
  isOpen,
  onClose,
  currentUserRole,
  highlightedProductId,
  onHighlight,
  onUnhighlight
}: PromotedProductsProps) {
  const { channelId } = useParams<{ channelId: string }>();
  const { toast } = useToast();

  // Highlight mutation
  const highlightMutation = trpc.channel.highlightProduct.useMutation({
    onSuccess: () => {
      toast({
        title: "Product highlighted",
        description: "All viewers can now see this product",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to highlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unhighlight mutation
  const unhighlightMutation = trpc.channel.unhighlightProduct.useMutation({
    onSuccess: () => {
      toast({
        title: "Highlight removed",
        description: "Product is no longer highlighted",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to unhighlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleHighlight = (productId: number) => {
    if (!channelId) return;
    highlightMutation.mutate({
      channelId: Number(channelId),
      productId,
    });
  };

  const handleUnhighlight = () => {
    if (!channelId) return;
    unhighlightMutation.mutate({
      channelId: Number(channelId),
    });
  };

  // ... rest of component
}
```

---

### Step 3: Update Product Item UI (45 min)

Add highlight button and visual indicator for each product:

```tsx
{products.map((product) => {
  const isHighlighted = product.id === highlightedProductId;
  const canHighlight = currentUserRole === 'SELLER';

  return (
    <div
      key={product.id}
      className={cn(
        "p-3 rounded-lg border transition-all",
        isHighlighted
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-accent/50"
      )}
    >
      {/* Highlighted badge */}
      {isHighlighted && (
        <div className="flex items-center gap-1 mb-2">
          <Sparkles className="size-3 text-primary" />
          <span className="text-xs font-semibold text-primary">
            Currently Highlighted
          </span>
        </div>
      )}

      {/* Product info */}
      <div className="flex gap-3">
        <div className="shrink-0 size-16 bg-muted rounded overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {product.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>

          {/* Highlight control buttons (SELLER only) */}
          {canHighlight && (
            <div className="mt-2">
              {isHighlighted ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnhighlight()}
                  disabled={unhighlightMutation.isLoading}
                  className="text-xs h-7"
                >
                  <X className="size-3 mr-1" />
                  Unhighlight
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleHighlight(product.id)}
                  disabled={highlightMutation.isLoading || !!highlightedProductId}
                  className="text-xs h-7"
                >
                  <Sparkles className="size-3 mr-1" />
                  Highlight
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
})}
```

**Key UI changes**:
- Highlighted products have border-primary and subtle background
- "Currently Highlighted" badge with Sparkles icon
- "Highlight" button (primary) for non-highlighted products
- "Unhighlight" button (outline) for highlighted product
- Disable "Highlight" if another product is already highlighted
- Show loading state during mutations

---

### Step 4: Add Optimistic Updates (Optional - 20 min)

For better UX, update local state immediately before server response:

```tsx
const handleHighlight = (productId: number) => {
  if (!channelId) return;
  
  // Optimistic update
  if (onHighlight) {
    onHighlight(productId);
  }
  
  highlightMutation.mutate(
    {
      channelId: Number(channelId),
      productId,
    },
    {
      onError: () => {
        // Rollback on error
        if (onUnhighlight) {
          onUnhighlight();
        }
      },
    }
  );
};
```

---

### Step 5: Update Component Imports (5 min)

Add required icons:

```tsx
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
```

---

### Step 6: Update Parent Component (20 min)

In `ChannelDetailsPage.tsx`, pass the new props:

```tsx
// Add state for highlighted product
const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);

// Fetch current user role (may already exist)
const currentUserRole = currentUser?.role; // 'SELLER' | 'BUYER'

// Render PromotedProducts with new props
<PromotedProducts
  products={promotedProducts}
  isOpen={showProducts}
  onClose={() => setShowProducts(false)}
  currentUserRole={currentUserRole}
  highlightedProductId={highlightedProductId}
  onHighlight={(productId) => setHighlightedProductId(productId)}
  onUnhighlight={() => setHighlightedProductId(null)}
/>
```

---

## Testing Checklist

- [ ] SELLER sees "Highlight" button on all non-highlighted products
- [ ] SELLER sees "Unhighlight" button on currently highlighted product
- [ ] Clicking "Highlight" calls tRPC mutation
- [ ] Clicking "Unhighlight" calls tRPC mutation
- [ ] Success toast appears after successful highlight
- [ ] Error toast appears on failure
- [ ] Highlighted product has visual indicator (badge, border, background)
- [ ] Only one "Unhighlight" button visible at a time
- [ ] "Highlight" buttons disabled when another product is highlighted
- [ ] BUYER does not see highlight controls
- [ ] Loading states work correctly
- [ ] Optimistic updates work (if implemented)

---

## Acceptance Criteria

✅ SELLER can highlight any promoted product from the panel  
✅ SELLER can unhighlight the current highlighted product  
✅ Visual indicator shows which product is currently highlighted  
✅ "Highlight" button changes to "Unhighlight" for active product  
✅ Only one product can be highlighted at a time (enforce in UI)  
✅ Toast notifications appear on success/error  
✅ Loading states prevent duplicate actions  
✅ BUYER users do not see highlight controls  
✅ tRPC mutations called with correct parameters  
✅ Component handles errors gracefully  

---

## Notes

- Use `Sparkles` icon from Lucide for highlight actions
- Consider adding animation when highlight state changes
- Ensure button states are clear (disabled vs. loading)
- Test permission enforcement (backend should also validate SELLER role)
- Consider adding confirmation dialog for unhighlight (optional)

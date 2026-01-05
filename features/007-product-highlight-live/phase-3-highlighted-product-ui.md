# Phase 3: Frontend - Highlighted Product Component

**Status**: 🔲 Not Started  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 1 (backend endpoints), Phase 2 (WebSocket events)

---

## Objective

Create the UI component to display the highlighted product below the chat input, with support for theme compatibility and future auction controls.

---

## Files to Create

### New Components
- `client/src/components/HighlightedProduct/HighlightedProduct.tsx`
- `client/src/components/HighlightedProduct/index.ts`
- `client/src/components/ProductDetailsSheet/ProductDetailsSheet.tsx`
- `client/src/components/ProductDetailsSheet/index.ts`

### Modified Files
- `client/src/pages/ChannelDetailsPage.tsx` - Integrate component

---

## Steps

### Step 1: Create `HighlightedProduct` Component (90 min)

**Location**: `client/src/components/HighlightedProduct/HighlightedProduct.tsx`

**Props**:
```typescript
interface HighlightedProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  } | null;
  isVisible: boolean; // Controlled by BUYER toggle
  onToggleVisibility: () => void;
  onProductClick: (productId: number) => void;
}
```

**Component Structure**:
```tsx
import { X, ExternalLink } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

export default function HighlightedProduct({
  product,
  isVisible,
  onToggleVisibility,
  onProductClick
}: HighlightedProductProps) {
  if (!product || !isVisible) return null;

  return (
    <Card className="mb-2 p-3 bg-card border-primary/50 border-2 animate-in slide-in-from-bottom">
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          🌟 Highlighted Product
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleVisibility}
          className="size-6"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Product content - clickable */}
      <div
        onClick={() => onProductClick(product.id)}
        className="flex gap-3 cursor-pointer hover:bg-accent/50 rounded p-2 transition-colors"
      >
        {/* Product image */}
        <div className="shrink-0 size-20 bg-muted rounded overflow-hidden">
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

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            {product.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Starting Price: <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* External link icon */}
        <div className="shrink-0">
          <ExternalLink className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Reserved space for future auction controls */}
      <div className="mt-2 pt-2 border-t border-border/50 min-h-[32px] flex items-center justify-center">
        <p className="text-[10px] text-muted-foreground italic">
          Auction controls will appear here
        </p>
      </div>
    </Card>
  );
}
```

**Styling Notes**:
- Use `bg-card`, `text-foreground`, `border-primary` for theme compatibility
- `animate-in slide-in-from-bottom` for smooth appearance
- `line-clamp-2` to truncate description
- Reserve 32px min-height for future auction controls

---

### Step 2: Create `ProductDetailsSheet` Component (60 min)

**Location**: `client/src/components/ProductDetailsSheet/ProductDetailsSheet.tsx`

**Props**:
```typescript
interface ProductDetailsSheetProps {
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Component**:
```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";

export default function ProductDetailsSheet({
  product,
  isOpen,
  onClose
}: ProductDetailsSheetProps) {
  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
          <SheetDescription>Product Details</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Product image */}
          {product.imageUrl ? (
            <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No image available</p>
            </div>
          )}

          {/* Price */}
          <div>
            <p className="text-sm text-muted-foreground">Starting Price</p>
            <p className="text-2xl font-bold text-foreground">
              ${product.price.toFixed(2)}
            </p>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Future: Add to cart / bid controls */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Purchase options coming soon
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

### Step 3: Create Index Files (5 min)

**`client/src/components/HighlightedProduct/index.ts`**:
```typescript
export { default } from './HighlightedProduct';
```

**`client/src/components/ProductDetailsSheet/index.ts`**:
```typescript
export { default } from './ProductDetailsSheet';
```

---

### Step 4: Integrate into `ChannelDetailsPage` (30 min)

**Location**: `client/src/pages/ChannelDetailsPage.tsx`

**Add state**:
```typescript
const [highlightedProduct, setHighlightedProduct] = useState<Product | null>(null);
const [showHighlightedProduct, setShowHighlightedProduct] = useState(true);
const [productDetailsOpen, setProductDetailsOpen] = useState(false);
const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
```

**Add component in ChatPanel** (below chat input, above message list):
```tsx
{/* Chat Panel */}
<div className="...">
  {/* Chat Input */}
  <div className="p-3 border-t border-border bg-background/95 backdrop-blur">
    <MessageInput ... />
  </div>

  {/* Highlighted Product - NEW */}
  <HighlightedProduct
    product={highlightedProduct}
    isVisible={showHighlightedProduct}
    onToggleVisibility={() => setShowHighlightedProduct(!showHighlightedProduct)}
    onProductClick={(productId) => {
      setSelectedProductId(productId);
      setProductDetailsOpen(true);
    }}
  />

  {/* Message List */}
  <MessageList ... />
</div>

{/* Product Details Sheet - NEW */}
<ProductDetailsSheet
  product={highlightedProduct}
  isOpen={productDetailsOpen}
  onClose={() => setProductDetailsOpen(false)}
/>
```

**Note**: WebSocket listeners and tRPC queries will be added in Phase 5.

---

### Step 5: Add Responsive Styling (15 min)

Ensure component works on mobile:

```tsx
// HighlightedProduct - adjust for mobile
<Card className="mb-2 p-2 md:p-3 ...">
  <div className="flex gap-2 md:gap-3 ...">
    <div className="size-16 md:size-20 ...">
      {/* Image */}
    </div>
    <div className="flex-1 ...">
      <h4 className="text-xs md:text-sm ...">
        {product.name}
      </h4>
      {/* ... */}
    </div>
  </div>
</Card>
```

---

## Testing Checklist

- [ ] Component renders correctly with product data
- [ ] Component hides when `isVisible` is false
- [ ] Component hides when `product` is null
- [ ] Close button toggles visibility
- [ ] Clicking product content opens ProductDetailsSheet
- [ ] ProductDetailsSheet displays all product info
- [ ] Theme compatibility (light/dark modes)
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Reserved space for auction controls visible
- [ ] Smooth animation on show/hide

---

## Acceptance Criteria

✅ `HighlightedProduct` component created with all required props  
✅ Component positioned below chat input, above message list  
✅ Product image, name, price (as "Starting Price"), and description displayed  
✅ Clicking product opens detailed view in Sheet  
✅ Close button toggles component visibility  
✅ Reserved space for future auction controls (32px min-height)  
✅ Theme-compatible styling (uses design tokens)  
✅ Responsive design works on mobile/tablet/desktop  
✅ Smooth animations (slide-in, fade, etc.)  
✅ ProductDetailsSheet component created and functional  

---

## Notes

- Use existing Shadcn components (Card, Sheet, Button) for consistency
- Follow STYLING.md conventions (Tailwind classes, design tokens)
- Test with long product names and descriptions (truncation)
- Ensure Z-index doesn't conflict with other overlays
- Consider adding skeleton loader for initial load state (Phase 6)

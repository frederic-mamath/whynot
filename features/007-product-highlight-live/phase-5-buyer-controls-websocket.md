# Phase 5: Frontend - BUYER Controls & WebSocket Integration

**Status**: 🔲 Not Started  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phases 1-4 complete

---

## Objective

Enable BUYER users to toggle highlighted product visibility and receive real-time updates via WebSocket when products are highlighted/unhighlighted.

---

## Files to Modify

- `client/src/components/VerticalControlPanel/VerticalControlPanel.tsx`
- `client/src/pages/ChannelDetailsPage.tsx`

---

## Steps

### Step 1: Add Highlighted Product Toggle Button (30 min)

**Location**: `client/src/components/VerticalControlPanel/VerticalControlPanel.tsx`

**Update props**:
```typescript
interface VerticalControlPanelProps {
  audioMuted?: boolean;
  videoMuted?: boolean;
  viewerCount: number;
  productCount?: number;
  highlightedProductCount?: number; // NEW - 0 or 1
  showBroadcastControls?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onShowParticipants: () => void;
  onShowProducts?: () => void;
  onToggleHighlightedProduct?: () => void; // NEW
}
```

**Add button**:
```tsx
import { Sparkles } from "lucide-react";

export default function VerticalControlPanel({
  // ... existing props
  highlightedProductCount = 0,
  onToggleHighlightedProduct,
}: VerticalControlPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* ... existing buttons (mic, video, participants, products) */}

      {/* Highlighted Product Toggle - NEW */}
      {onToggleHighlightedProduct && highlightedProductCount > 0 && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleHighlightedProduct}
          title="Toggle highlighted product"
          className="shrink-0 relative shadow-lg"
        >
          <Sparkles className="size-5" />
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
            {highlightedProductCount}
          </span>
        </Button>
      )}
    </div>
  );
}
```

**Notes**:
- Only show button when `highlightedProductCount > 0`
- Badge shows "1" when product is highlighted
- Button available to all users (BUYER and SELLER)

---

### Step 2: Fetch Current Highlight on Channel Join (30 min)

**Location**: `client/src/pages/ChannelDetailsPage.tsx`

Add tRPC query to fetch current highlight when component mounts:

```tsx
import { trpc } from '@/lib/trpc';

export default function ChannelDetailsPage() {
  const { channelId } = useParams<{ channelId: string }>();
  const [highlightedProduct, setHighlightedProduct] = useState<Product | null>(null);
  const [showHighlightedProduct, setShowHighlightedProduct] = useState(true);

  // Fetch current highlighted product on mount
  const { data: highlightData } = trpc.channel.getHighlightedProduct.useQuery(
    { channelId: Number(channelId) },
    { enabled: !!channelId }
  );

  // Update state when query resolves
  useEffect(() => {
    if (highlightData?.product) {
      setHighlightedProduct(highlightData.product);
    } else {
      setHighlightedProduct(null);
    }
  }, [highlightData]);

  // ... rest of component
}
```

---

### Step 3: Add WebSocket Message Listeners (45 min)

**Location**: `client/src/pages/ChannelDetailsPage.tsx`

Add handlers for `PRODUCT_HIGHLIGHTED` and `PRODUCT_UNHIGHLIGHTED`:

```tsx
import { useToast } from '@/hooks/use-toast';

export default function ChannelDetailsPage() {
  const { toast } = useToast();
  
  // ... existing state and hooks

  useEffect(() => {
    if (!ws || !channelId) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      // Handle PRODUCT_HIGHLIGHTED
      if (message.type === 'PRODUCT_HIGHLIGHTED' && message.channelId === Number(channelId)) {
        setHighlightedProduct(message.product);
        setShowHighlightedProduct(true); // Auto-show on new highlight
        
        // Show toast notification
        toast({
          title: "🌟 New Product Highlighted",
          description: `Check out: ${message.product.name}`,
          duration: 4000,
        });
      }

      // Handle PRODUCT_UNHIGHLIGHTED
      if (message.type === 'PRODUCT_UNHIGHLIGHTED' && message.channelId === Number(channelId)) {
        setHighlightedProduct(null);
        
        // Optional: toast for unhighlight
        toast({
          title: "Highlight removed",
          description: "The host removed the product highlight",
          duration: 3000,
        });
      }

      // ... existing message handlers (chat, user joined, etc.)
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws, channelId, toast]);

  // ... rest of component
}
```

---

### Step 4: Connect Toggle Button to State (15 min)

In `ChannelDetailsPage.tsx`, wire up the toggle button:

```tsx
<VerticalControlPanel
  audioMuted={audioMuted}
  videoMuted={videoMuted}
  viewerCount={Array.from(remoteUsers.values()).length}
  productCount={promotedProducts.filter((p) => p.isActive).length}
  highlightedProductCount={highlightedProduct ? 1 : 0} // NEW
  showBroadcastControls={canPublish}
  onToggleAudio={canPublish ? toggleAudio : undefined}
  onToggleVideo={canPublish ? toggleVideo : undefined}
  onShowParticipants={() => setShowParticipants(true)}
  onShowProducts={() => setShowProducts(true)}
  onToggleHighlightedProduct={() => setShowHighlightedProduct(!showHighlightedProduct)} // NEW
/>
```

---

### Step 5: Add Visibility Persistence (Optional - 20 min)

Store user's visibility preference in localStorage:

```tsx
// Load preference on mount
useEffect(() => {
  const savedPref = localStorage.getItem('highlightedProductVisible');
  if (savedPref !== null) {
    setShowHighlightedProduct(savedPref === 'true');
  }
}, []);

// Save preference on change
useEffect(() => {
  localStorage.setItem('highlightedProductVisible', String(showHighlightedProduct));
}, [showHighlightedProduct]);
```

**Note**: This persists the toggle state across page refreshes.

---

### Step 6: Handle Reconnection (20 min)

Refetch current highlight when WebSocket reconnects:

```tsx
const highlightQuery = trpc.channel.getHighlightedProduct.useQuery(
  { channelId: Number(channelId) },
  { 
    enabled: !!channelId,
    refetchOnMount: true,
    refetchOnReconnect: true, // Refetch on WS reconnect
  }
);

useEffect(() => {
  if (!ws) return;

  const handleOpen = () => {
    // Refetch current highlight on reconnect
    highlightQuery.refetch();
  };

  ws.addEventListener('open', handleOpen);

  return () => {
    ws.removeEventListener('open', handleOpen);
  };
}, [ws, highlightQuery]);
```

---

## Testing Checklist

- [ ] BUYER sees Sparkles button when product is highlighted
- [ ] Sparkles button badge shows "1" when product is highlighted
- [ ] Sparkles button hidden when no product is highlighted
- [ ] Clicking Sparkles button toggles `HighlightedProduct` visibility
- [ ] New highlight appears instantly via WebSocket
- [ ] Toast notification shows when product is highlighted
- [ ] Toast notification shows when product is unhighlighted
- [ ] Highlighted product auto-shows when new highlight received
- [ ] BUYER joining mid-highlight sees current highlighted product
- [ ] WebSocket reconnection refetches current highlight
- [ ] Visibility preference persists across refreshes (if implemented)
- [ ] Multi-tab sync works correctly

---

## Acceptance Criteria

✅ Sparkles toggle button added to VerticalControlPanel  
✅ Button only visible when a product is highlighted  
✅ Badge shows count (0 or 1) on button  
✅ Button toggles HighlightedProduct component visibility  
✅ WebSocket listener handles PRODUCT_HIGHLIGHTED messages  
✅ WebSocket listener handles PRODUCT_UNHIGHLIGHTED messages  
✅ Toast notifications appear on highlight/unhighlight events  
✅ Current highlight fetched on channel join  
✅ New highlight auto-shows (sets visibility to true)  
✅ WebSocket reconnection refetches current state  
✅ Works for both BUYER and SELLER users  

---

## Notes

- Use `Sparkles` icon from Lucide for consistency
- Auto-show on new highlight (UX: don't hide new content)
- Consider vibration/sound for mobile notifications (future enhancement)
- Test with multiple browser tabs to simulate multiple users
- Ensure WebSocket message order is preserved
- Handle edge case: user toggles visibility while new highlight arrives

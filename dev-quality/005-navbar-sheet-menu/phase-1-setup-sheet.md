# Phase 1: Import and Setup Sheet Component

## Objective
Import Sheet components from Shadcn UI and set up basic structure in NavBar

## Estimated Time
20 minutes

## Files to Update
- `client/src/components/NavBar/NavBar.tsx`

## Current Implementation
```tsx
// Current mobile menu button
<Button
  variant="ghost"
  size="icon"
  className="md:hidden"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
>
  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
</Button>

// Current mobile menu (conditional rendering)
{mobileMenuOpen && (
  <div className="md:hidden border-t border-border py-4">
    {/* Menu items */}
  </div>
)}
```

## Target Implementation
```tsx
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

// ...

<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      aria-label="Toggle menu"
    >
      <Menu className="size-5" />
    </Button>
  </SheetTrigger>
  
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
    </SheetHeader>
    
    <div className="flex flex-col space-y-2 mt-6">
      {/* Existing menu items will go here in Phase 2 */}
      <p className="text-sm text-muted-foreground">Menu items...</p>
    </div>
  </SheetContent>
</Sheet>
```

## Steps

### 1. Add Sheet Imports
At the top of `NavBar.tsx`, add:
```tsx
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
```

### 2. Update Mobile Menu Button
Replace the current mobile menu button with SheetTrigger:

**Before**:
```tsx
<Button
  variant="ghost"
  size="icon"
  className="md:hidden"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label="Toggle menu"
>
  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
</Button>
```

**After**:
```tsx
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      aria-label="Toggle menu"
    >
      <Menu className="size-5" />
    </Button>
  </SheetTrigger>
</Sheet>
```

**Notes**:
- Remove the `X` icon (Sheet has built-in close button)
- Remove manual `onClick` (Sheet manages state via `onOpenChange`)
- Keep `md:hidden` - only show on mobile

### 3. Add SheetContent Structure
Inside the Sheet component, add SheetContent:

```tsx
<SheetContent side="right">
  <SheetHeader>
    <SheetTitle>Menu</SheetTitle>
  </SheetHeader>
  
  <div className="flex flex-col space-y-2 mt-6">
    {/* Placeholder for Phase 2 */}
    {authenticated ? (
      <p className="text-sm">Authenticated menu...</p>
    ) : (
      <p className="text-sm">Guest menu...</p>
    )}
  </div>
</SheetContent>
```

### 4. Keep Old Mobile Menu (Temporarily)
Don't remove the old mobile menu yet - we'll migrate items in Phase 2:

```tsx
{/* Old mobile menu - will be removed in Phase 2 */}
{mobileMenuOpen && (
  <div className="md:hidden border-t border-border py-4">
    {/* ... existing menu items ... */}
  </div>
)}
```

## Testing Checkpoints

### ✅ Visual Test
1. Open app on mobile (< 768px width)
2. Click Menu icon
3. Sheet should slide in from the right
4. Backdrop overlay should appear
5. Click backdrop - Sheet should close
6. Press Escape - Sheet should close

### ✅ Desktop Test
1. Open app on desktop (> 768px width)
2. Verify Sheet trigger is hidden (`md:hidden`)
3. Verify desktop horizontal menu still works

### ✅ Console Check
- No errors in browser console
- No React warnings about missing keys

## Acceptance Criteria
- ✅ Sheet component imported successfully
- ✅ Sheet opens when clicking Menu button
- ✅ Sheet slides in from the right side
- ✅ Backdrop overlay appears with blur
- ✅ Sheet closes on backdrop click
- ✅ Sheet closes on Escape key
- ✅ Desktop menu unchanged
- ✅ No console errors

## Next Phase
Phase 2: Move actual menu items into Sheet and remove old mobile menu

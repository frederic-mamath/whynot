# Phase 3: Mobile Sheet Menu Organization

## Objective

Reorganize the mobile sheet menu with visual section headers, consistent ordering with desktop, and improved hierarchy. Mobile menu appears below xl breakpoint (1280px).

---

## Files to Update

- `client/src/components/NavBar/NavBar.tsx` (desktop/mobile breakpoints and mobile menu structure)

---

## Current Mobile Structure Issues

1. **No visual sections** - All items in flat list
2. **Theme toggle** at top right (inconsistent with content flow)
3. **User info** takes space at top
4. **No section headers** - Hard to scan
5. **Logout** needs better visual separation

---

## New Mobile Sheet Structure

### Sheet Header (keep existing)

```tsx
<SheetHeader>
  <SheetTitle>Menu</SheetTitle>
  <SheetClose>...</SheetClose>
</SheetHeader>
```

### Sheet Body

#### For Guests

```tsx
<div className="flex flex-col h-full pt-6">
  {/* Theme Toggle - right aligned */}
  <div className="flex items-center justify-end mb-6">
    <ThemeToggle />
  </div>

  {/* Navigation */}
  <nav className="flex flex-col gap-1 flex-1">
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/channels" onClick={closeSheet}>
        <Video className="size-4 mr-2" />
        Channels
      </Link>
    </Button>

    {/* Separator */}
    <div className="h-px bg-border my-4" />

    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/login" onClick={closeSheet}>
        <LogIn className="size-4 mr-2" />
        Login
      </Link>
    </Button>

    <Button variant="default" className="justify-start" asChild>
      <Link to="/register" onClick={closeSheet}>
        <UserPlus className="size-4 mr-2" />
        Sign Up
      </Link>
    </Button>
  </nav>
</div>
```

#### For Authenticated Buyers (Non-Sellers)

```tsx
<div className="flex flex-col h-full pt-6">
  {/* Theme Toggle */}
  <div className="flex items-center justify-end mb-4">
    <ThemeToggle />
  </div>

  {/* User Info Card */}
  {user && (
    <div className="flex items-center gap-3 px-2 py-3 mb-6 rounded-lg bg-accent">
      <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-semibold">
        {user.email[0].toUpperCase()}
      </div>
      <span className="text-sm font-medium truncate">{user.email}</span>
    </div>
  )}

  {/* Navigation */}
  <nav className="flex flex-col gap-1 flex-1">
    {/* Browse Section */}
    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Browse
    </div>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/channels" onClick={closeSheet}>
        <Video className="size-4 mr-2" />
        Channels
      </Link>
    </Button>

    {/* My Activity Section */}
    <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      My Activity
    </div>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/dashboard" onClick={closeSheet}>
        <Home className="size-4 mr-2" />
        Dashboard
      </Link>
    </Button>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/my-orders" onClick={closeSheet}>
        <ShoppingBag className="size-4 mr-2" />
        My Orders
      </Link>
    </Button>

    {/* Actions Section (if applicable) */}
    {!isSeller && (
      <>
        <div className="h-px bg-border my-4" />
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => {
            handleRequestSellerRole();
            closeSheet();
          }}
          disabled={hasPendingRequest || requestSellerRole.isPending}
        >
          <BadgeCheck className="size-4 mr-2" />
          {hasPendingRequest ? "Request Pending" : "Become a Seller"}
        </Button>
      </>
    )}

    {/* Logout at bottom */}
    <div className="border-t border-border pt-4 mt-auto">
      <Button
        variant="ghost"
        className="justify-start w-full text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="size-4 mr-2" />
        Logout
      </Button>
    </div>
  </nav>
</div>
```

#### For Authenticated Sellers

```tsx
<div className="flex flex-col h-full pt-6">
  {/* Theme Toggle */}
  <div className="flex items-center justify-end mb-4">
    <ThemeToggle />
  </div>

  {/* User Info Card */}
  {user && (
    <div className="flex items-center gap-3 px-2 py-3 mb-6 rounded-lg bg-accent">
      <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-semibold">
        {user.email[0].toUpperCase()}
      </div>
      <span className="text-sm font-medium truncate">{user.email}</span>
    </div>
  )}

  {/* Navigation */}
  <nav className="flex flex-col gap-1 flex-1">
    {/* Browse Section */}
    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Browse
    </div>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/channels" onClick={closeSheet}>
        <Video className="size-4 mr-2" />
        Channels
      </Link>
    </Button>

    {/* My Activity Section */}
    <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      My Activity
    </div>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/dashboard" onClick={closeSheet}>
        <Home className="size-4 mr-2" />
        Dashboard
      </Link>
    </Button>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/my-orders" onClick={closeSheet}>
        <ShoppingBag className="size-4 mr-2" />
        My Orders
      </Link>
    </Button>

    {/* Sell Section */}
    <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Sell
    </div>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/shops" onClick={closeSheet}>
        <Store className="size-4 mr-2" />
        Shops
      </Link>
    </Button>
    <Button variant="ghost" className="justify-start" asChild>
      <Link to="/pending-deliveries" onClick={closeSheet}>
        <Package className="size-4 mr-2" />
        Pending Deliveries
      </Link>
    </Button>

    {/* Primary Action */}
    <div className="h-px bg-border my-4" />
    <Button variant="default" className="justify-start" asChild>
      <Link to="/create-channel" onClick={closeSheet}>
        <Plus className="size-4 mr-2" />
        Create Channel
      </Link>
    </Button>

    {/* Logout at bottom */}
    <div className="border-t border-border pt-4 mt-auto">
      <Button
        variant="ghost"
        className="justify-start w-full text-destructive hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="size-4 mr-2" />
        Logout
      </Button>
    </div>
  </nav>
</div>
```

---

## Steps

1. **Replace mobile sheet content** - Update lines 199-332
2. **Add section headers** - Use uppercase, muted text
3. **Add visual separators** - Horizontal dividers between sections
4. **Reorganize items** - Match desktop order and grouping
5. **Test sheet scrolling** - Ensure all content accessible on small screens
6. **Verify close behavior** - All links should close sheet via `closeSheet()`
7. **Test theme toggle** - Should work in mobile menu

---

## Design Considerations

### Section Headers

```tsx
<div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
  Section Name
</div>
```

- Small, uppercase text
- Muted color (not clickable)
- Padding for spacing
- Wide letter spacing for readability

### Visual Separators

```tsx
<div className="h-px bg-border my-4" />
```

- Horizontal line
- Used before primary actions
- Used before logout section

### Spacing

- `gap-1` between navigation items (tight)
- `mt-3` before section headers (breathing room)
- `my-4` for separators
- `mb-6` after user card

### User Info Card

- Keep existing design with bg-accent
- Rounded corners
- Avatar + email
- Positioned after theme toggle

### Logout Button

- Always at bottom with `mt-auto`
- Border-top separator
- Destructive text color
- Full width

---

## Acceptance Criteria

- [x] Section headers visible for Browse, My Activity, Sell
- [x] Mobile menu matches desktop navigation order
- [x] Theme toggle accessible at top
- [x] User info card displayed prominently
- [x] Horizontal separators between major sections
- [x] Logout button at bottom with border
- [x] All links close sheet on click
- [x] Sheet scrollable on small screens
- [x] Guest view shows simplified menu (no Channels)
- [x] Buyer view shows Browse + My Activity sections
- [x] Seller view shows Browse + My Activity + Sell sections
- [x] "Become a Seller" shown to buyers with separator
- [x] "Create Channel" shown to sellers as primary action
- [x] Mobile menu appears below xl breakpoint (1280px)
- [x] Desktop nav appears at xl breakpoint and above

---

## Status

✅ **DONE** - Mobile sheet menu reorganized with sections, xl breakpoint implemented

---

## Notes

### Mobile Sheet Height Management

- Use `flex-1` on nav container to allow growth
- Use `mt-auto` on logout section to push to bottom
- Sheet body has `h-full` to fill available space
- Content should scroll if too tall (Shadcn Sheet default behavior)

### Consistency with Desktop

- Same icon usage
- Same link order within sections
- Same button variants (ghost for nav, default for primary, outline for secondary)

### Accessibility

- Section headers use semantic markup (divs with ARIA-friendly text)
- All buttons remain keyboard accessible
- Screen readers can announce sections clearly

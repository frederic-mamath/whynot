# Phase 2: Desktop Navigation Implementation

## Objective

Implement the redesigned desktop navigation with all links visible, logical grouping, and visual separators for clarity.

---

## Files to Update

- `client/src/components/NavBar/NavBar.tsx` (lines 107-197)

---

## Implementation Plan

### Current Desktop Structure (to replace)

```tsx
<div className="hidden md:flex items-center gap-2">
  <ThemeToggle />
  {authenticated ? (
    <>
      <Button>Dashboard</Button>
      <Button>Channels</Button>
      {isSeller && <Button>Shops</Button>}
      {!isSeller && <Button>Become Seller</Button>}
      <Button>Create</Button>
      {user && <div>Avatar + Email</div>}
      <Button>Logout</Button>
    </>
  ) : (
    <>
      <Button>Login</Button>
      <Button>Sign Up</Button>
    </>
  )}
</div>
```

### New Desktop Structure

#### For Guests

```tsx
<div className="hidden md:flex items-center gap-2">
  <ThemeToggle />

  <Button variant="ghost" size="sm" asChild>
    <Link to="/login">
      <LogIn className="size-4 mr-2" />
      Login
    </Link>
  </Button>

  <Button variant="default" size="sm" asChild>
    <Link to="/register">
      <UserPlus className="size-4 mr-2" />
      Sign Up
    </Link>
  </Button>
</div>
```

#### For Authenticated Buyers (Non-Sellers)

```tsx
<div className="hidden md:flex items-center gap-2">
  {/* Browse + My Activity */}
  <Button variant="ghost" size="sm" asChild>
    <Link to="/dashboard">
      <Home className="size-4 mr-2" />
      Dashboard
    </Link>
  </Button>

  <Button variant="ghost" size="sm" asChild>
    <Link to="/my-orders">
      <ShoppingBag className="size-4 mr-2" />
      My Orders
    </Link>
  </Button>

  <Button variant="ghost" size="sm" asChild>
    <Link to="/channels">
      <Video className="size-4 mr-2" />
      Channels
    </Link>
  </Button>

  {/* Separator */}
  <div className="h-6 w-px bg-border mx-2" />

  {/* Actions */}
  <Button
    variant="outline"
    size="sm"
    onClick={handleRequestSellerRole}
    disabled={hasPendingRequest || requestSellerRole.isPending}
  >
    <BadgeCheck className="size-4 mr-2" />
    {hasPendingRequest ? "Pending" : "Become a Seller"}
  </Button>

  {/* Separator */}
  <div className="h-6 w-px bg-border mx-2" />

  {/* Account */}
  <ThemeToggle />
  {user && (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-accent">
        <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {user.email[0].toUpperCase()}
        </div>
        <span className="text-sm hidden lg:inline">{user.email}</span>
      </div>
    </div>
  )}

  <Button variant="ghost" size="sm" onClick={handleLogout}>
    <LogOut className="size-4 mr-2" />
    <span className="hidden lg:inline">Logout</span>
    <span className="lg:hidden">Exit</span>
  </Button>
</div>
```

#### For Authenticated Sellers

```tsx
<div className="hidden md:flex items-center gap-2">
  {/* Browse + My Activity */}
  <Button variant="ghost" size="sm" asChild>
    <Link to="/dashboard">
      <Home className="size-4 mr-2" />
      Dashboard
    </Link>
  </Button>

  <Button variant="ghost" size="sm" asChild>
    <Link to="/my-orders">
      <ShoppingBag className="size-4 mr-2" />
      My Orders
    </Link>
  </Button>

  <Button variant="ghost" size="sm" asChild>
    <Link to="/channels">
      <Video className="size-4 mr-2" />
      Channels
    </Link>
  </Button>

  <Button variant="ghost" size="sm" asChild>
    <Link to="/shops">
      <Store className="size-4 mr-2" />
      Shops
    </Link>
  </Button>

  <Button variant="ghost" size="sm" asChild>
    <Link to="/pending-deliveries">
      <Package className="size-4 mr-2" />
      Deliveries
    </Link>
  </Button>

  {/* Separator */}
  <div className="h-6 w-px bg-border mx-2" />

  {/* Primary Action */}
  <Button variant="default" size="sm" asChild>
    <Link to="/create-channel">
      <Plus className="size-4 mr-2" />
      Create
    </Link>
  </Button>

  {/* Separator */}
  <div className="h-6 w-px bg-border mx-2" />

  {/* Account */}
  <ThemeToggle />
  {user && (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-accent">
        <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {user.email[0].toUpperCase()}
        </div>
        <span className="text-sm hidden lg:inline">{user.email}</span>
      </div>
    </div>
  )}

  <Button variant="ghost" size="sm" onClick={handleLogout}>
    <LogOut className="size-4 mr-2" />
    <span className="hidden lg:inline">Logout</span>
    <span className="lg:hidden">Exit</span>
  </Button>
</div>
```

---

## Steps

1. **Backup current code** - Save current lines 107-197 for reference
2. **Update imports** - Ensure all icons are imported (ShoppingBag, Package already there)
3. **Replace desktop nav section** - Lines 107-197 with new grouped structure
4. **Add separators** - Use `<div className="h-6 w-px bg-border mx-2" />`
5. **Test all states**:
   - Guest view (not authenticated)
   - Buyer view (authenticated, no seller role)
   - Seller view (authenticated + seller role)
6. **Verify responsiveness** - Check lg breakpoint for email text
7. **Verify links** - All routes should work correctly

---

## Design Considerations

### Visual Separators

- Use `<div className="h-6 w-px bg-border mx-2" />` for vertical lines
- Place between logical groups (Browse/Activity, Actions, Account)
- Maintains consistent spacing with `mx-2`

### Responsive Behavior

- Hide email text on smaller desktops with `hidden lg:inline`
- Toggle "Logout" vs "Exit" text with lg breakpoint
- Desktop navigation appears at xl breakpoint (1280px+)
- Mobile sheet menu appears below xl breakpoint

### Button Hierarchy

- **Primary**: `variant="default"` for main CTA (Sign Up, Create Channel)
- **Secondary**: `variant="outline"` for important but not primary (Become Seller)
- **Navigation**: `variant="ghost"` for standard navigation links
- **Account**: Keep current avatar/email styling with bg-accent

### Icon Consistency

- All buttons include icons for visual clarity
- Icons positioned before text with `mr-2`
- Size `size-4` for consistency (16px)

---

## Acceptance Criteria

- [x] Desktop nav shows "My Orders" for all authenticated users
- [x] Desktop nav shows "Pending Deliveries" for sellers
- [x] Visual separators clearly divide logical groups
- [x] Guest view shows: Theme, Login, Sign Up (no Channels)
- [x] Buyer view shows: Dashboard, My Orders, Channels | Become Seller | Theme, Avatar, Logout
- [x] Seller view shows: Dashboard, My Orders, Channels, Shops, Deliveries | Create | Theme, Avatar, Logout
- [x] ThemeToggle visible in all states
- [x] All links navigate correctly
- [x] Responsive behavior works (lg breakpoint for email)
- [x] No visual regressions on desktop

---

## Status

✅ **DONE** - Desktop navigation implemented with all improvements

---

## Notes

### Component Order (left to right)

**For reference, the final order should be:**

1. **Logo** (always leftmost) - handled by parent div
2. **Navigation links** (Browse + My Activity + Sell)
3. **Separator**
4. **Primary action** (Become Seller or Create Channel)
5. **Separator**
6. **Account** (Theme, Avatar, Logout)

This creates a logical flow: Browse → Act → Account

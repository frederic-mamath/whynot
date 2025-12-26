# Phase 2: Refactor Mobile Menu UI

## Objective
Move all menu items from the old mobile menu into the Sheet component and improve layout

## Estimated Time
30 minutes

## Files to Update
- `client/src/components/NavBar/NavBar.tsx`

## Current State
- Sheet opens with placeholder text
- Old mobile menu still exists below navbar
- Menu items duplicated (old + new placeholder)

## Target State
- All menu items inside Sheet
- Old mobile menu code removed
- Proper spacing and styling
- User profile at top (if authenticated)
- Navigation links in middle
- Logout at bottom (if authenticated)

## Implementation

### 1. User Profile Section (Authenticated Only)
Move the user profile display to the top of Sheet:

```tsx
<SheetContent side="right">
  <SheetHeader>
    <SheetTitle>Menu</SheetTitle>
  </SheetHeader>
  
  <div className="flex flex-col space-y-2 mt-6">
    {/* User Profile */}
    {authenticated && user && (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent">
        <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {user.email[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{user.email}</span>
          <span className="text-xs text-muted-foreground">Signed in</span>
        </div>
      </div>
    )}
    
    {/* Separator */}
    {authenticated && user && (
      <div className="border-t border-border my-2"></div>
    )}
    
    {/* Navigation links will go here */}
  </div>
</SheetContent>
```

### 2. Navigation Links (Authenticated)
Add navigation buttons for authenticated users:

```tsx
{authenticated ? (
  <>
    <Button 
      variant="ghost" 
      className="justify-start" 
      asChild
    >
      <Link to="/dashboard" onClick={closeMobileMenu}>
        <Home className="size-4 mr-2" />
        Dashboard
      </Link>
    </Button>

    <Button 
      variant="ghost" 
      className="justify-start" 
      asChild
    >
      <Link to="/channels" onClick={closeMobileMenu}>
        <Video className="size-4 mr-2" />
        Channels
      </Link>
    </Button>

    <Button 
      variant="ghost" 
      className="justify-start" 
      asChild
    >
      <Link to="/shops" onClick={closeMobileMenu}>
        <Store className="size-4 mr-2" />
        Shops
      </Link>
    </Button>

    <Button 
      variant="default" 
      className="justify-start" 
      asChild
    >
      <Link to="/create-channel" onClick={closeMobileMenu}>
        <Plus className="size-4 mr-2" />
        Create Channel
      </Link>
    </Button>

    {/* Separator before logout */}
    <div className="border-t border-border my-2"></div>

    <Button 
      variant="ghost" 
      className="justify-start text-destructive hover:text-destructive" 
      onClick={handleLogout}
    >
      <LogOut className="size-4 mr-2" />
      Logout
    </Button>
  </>
) : (
  /* Guest navigation - next section */
)}
```

### 3. Navigation Links (Guest)
Add navigation for unauthenticated users:

```tsx
{/* Guest menu */}
<>
  <Button 
    variant="ghost" 
    className="justify-start" 
    asChild
  >
    <Link to="/login" onClick={closeMobileMenu}>
      <LogIn className="size-4 mr-2" />
      Login
    </Link>
  </Button>

  <Button 
    variant="default" 
    className="justify-start" 
    asChild
  >
    <Link to="/register" onClick={closeMobileMenu}>
      <UserPlus className="size-4 mr-2" />
      Sign Up
    </Link>
  </Button>
</>
```

### 4. Update closeMobileMenu Function
The existing function should work as-is since Sheet uses `onOpenChange`:

```tsx
const closeMobileMenu = () => setMobileMenuOpen(false);
```

### 5. Remove Old Mobile Menu
After confirming Sheet works, **delete** the old conditional mobile menu:

**DELETE THIS BLOCK**:
```tsx
{/* Mobile Navigation Menu */}
{mobileMenuOpen && (
  <div className="md:hidden border-t border-border py-4">
    <div className="flex flex-col space-y-2">
      {/* ... all the old menu items ... */}
    </div>
  </div>
)}
```

## Complete SheetContent Structure

```tsx
<SheetContent side="right" className="w-80">
  <SheetHeader>
    <SheetTitle>Menu</SheetTitle>
  </SheetHeader>
  
  <div className="flex flex-col space-y-2 mt-6">
    {authenticated ? (
      <>
        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent">
            <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-xs text-muted-foreground">Signed in</span>
            </div>
          </div>
        )}

        <div className="border-t border-border my-2"></div>

        {/* Navigation Links */}
        <Button variant="ghost" className="justify-start" asChild>
          <Link to="/dashboard" onClick={closeMobileMenu}>
            <Home className="size-4 mr-2" />
            Dashboard
          </Link>
        </Button>

        <Button variant="ghost" className="justify-start" asChild>
          <Link to="/channels" onClick={closeMobileMenu}>
            <Video className="size-4 mr-2" />
            Channels
          </Link>
        </Button>

        <Button variant="ghost" className="justify-start" asChild>
          <Link to="/shops" onClick={closeMobileMenu}>
            <Store className="size-4 mr-2" />
            Shops
          </Link>
        </Button>

        <Button variant="default" className="justify-start" asChild>
          <Link to="/create-channel" onClick={closeMobileMenu}>
            <Plus className="size-4 mr-2" />
            Create Channel
          </Link>
        </Button>

        <div className="border-t border-border my-2"></div>

        {/* Logout */}
        <Button 
          variant="ghost" 
          className="justify-start text-destructive hover:text-destructive" 
          onClick={handleLogout}
        >
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </>
    ) : (
      <>
        {/* Guest Menu */}
        <Button variant="ghost" className="justify-start" asChild>
          <Link to="/login" onClick={closeMobileMenu}>
            <LogIn className="size-4 mr-2" />
            Login
          </Link>
        </Button>

        <Button variant="default" className="justify-start" asChild>
          <Link to="/register" onClick={closeMobileMenu}>
            <UserPlus className="size-4 mr-2" />
            Sign Up
          </Link>
        </Button>
      </>
    )}
  </div>
</SheetContent>
```

## Testing Checkpoints

### ✅ Authenticated User
1. Login as a user
2. Open mobile menu
3. Verify user profile shows at top
4. Verify all navigation links appear
5. Click each link - Sheet should close
6. Click Logout - should logout and close Sheet

### ✅ Guest User
1. Logout (or use incognito)
2. Open mobile menu
3. Verify Login and Sign Up buttons appear
4. Click Login - should navigate and close Sheet

### ✅ Layout
1. Verify spacing is consistent
2. Verify icons align properly
3. Verify text is readable
4. Verify no overflow or scrolling issues

### ✅ Old Menu Removed
1. Inspect DOM - no duplicate menu items
2. No empty divs below navbar
3. No conditional mobile menu rendering

## Acceptance Criteria
- ✅ All menu items moved to Sheet
- ✅ Old mobile menu code deleted
- ✅ User profile displays correctly (if authenticated)
- ✅ Navigation links work and close Sheet
- ✅ Logout works and closes Sheet
- ✅ Guest menu shows Login/Sign Up
- ✅ Proper spacing and alignment
- ✅ No duplicate menu items
- ✅ Icons and text aligned
- ✅ No console errors

## Next Phase
Phase 3: Testing and Polish (cross-device testing, accessibility, animations)

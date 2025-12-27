# Phase 5: Add "Become a Seller" Button to NavBar

## Objective
Add "Become a Seller" button to NavBar that creates a pending SELLER role request for the authenticated user.

## Estimated Time
1-2 hours

## Files to Update
- `client/src/components/NavBar/NavBar.tsx`

## UI/UX Design

### Button Placement
- **Desktop**: Between "Shops" and "Create Channel" buttons
- **Mobile**: In the Sheet menu, same position

### Button States
1. **Hidden**: User not logged in OR already has active SELLER role
2. **Visible**: User logged in with only BUYER role
3. **Disabled + "Pending"**: User has pending SELLER request (activated_at = NULL)

### Button Styling
- Icon: `<BadgeCheck />` from lucide-react
- Variant: `outline` (stands out but not primary action)
- Text: "Become a Seller" (desktop), "Become Seller" (mobile)

## Detailed Steps

### 1. Add necessary imports
```typescript
import { BadgeCheck } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
```

### 2. Add tRPC hooks
```typescript
// Inside NavBar component, after existing hooks
const { data: userRoles } = trpc.role.myRoles.useQuery(undefined, {
  enabled: authenticated,
});

const requestSellerRole = trpc.role.requestSellerRole.useMutation({
  onSuccess: (data) => {
    toast({
      title: "Request Submitted",
      description: data.message,
    });
    // Refetch roles to show pending state
    trpc.role.myRoles.invalidate();
  },
  onError: (error) => {
    toast({
      title: "Request Failed",
      description: error.message,
      variant: "destructive",
    });
  },
});

const { toast } = useToast();
```

### 3. Create helper functions
```typescript
// Check if user is seller (active)
const isSeller = userRoles?.roles.includes('SELLER') ?? false;

// Check if user has pending request
const hasPendingRequest = userRoles?.details.some(
  (role) => role.role_name === 'SELLER' && role.activated_at === null
) ?? false;

// Handle seller request
const handleRequestSellerRole = async () => {
  try {
    await requestSellerRole.mutateAsync();
  } catch (error) {
    // Error handled by onError callback
  }
};
```

### 4. Add button to desktop navigation
Insert between Shops and Create Channel buttons:

```typescript
{/* Desktop Navigation */}
<div className="hidden md:flex items-center gap-2">
  {authenticated ? (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <Home className="size-4 mr-2" />
          Dashboard
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

      {/* NEW: Become a Seller Button */}
      {!isSeller && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestSellerRole}
          disabled={hasPendingRequest || requestSellerRole.isPending}
        >
          <BadgeCheck className="size-4 mr-2" />
          {hasPendingRequest ? 'Pending' : 'Become a Seller'}
        </Button>
      )}

      <Button variant="default" size="sm" asChild>
        <Link to="/create-channel">
          <Plus className="size-4 mr-2" />
          Create
        </Link>
      </Button>

      {/* ... rest of desktop nav */}
    </>
  ) : (
    // ... logged out state
  )}
</div>
```

### 5. Add button to mobile Sheet menu
Insert between Shops and Create Channel in the Sheet:

```typescript
<nav className="flex flex-col gap-2 flex-1">
  <Button variant="ghost" className="justify-start" asChild>
    <Link to="/dashboard" onClick={closeSheet}>
      <Home className="size-4 mr-2" />
      Dashboard
    </Link>
  </Button>

  <Button variant="ghost" className="justify-start" asChild>
    <Link to="/channels" onClick={closeSheet}>
      <Video className="size-4 mr-2" />
      Channels
    </Link>
  </Button>

  <Button variant="ghost" className="justify-start" asChild>
    <Link to="/shops" onClick={closeSheet}>
      <Store className="size-4 mr-2" />
      Shops
    </Link>
  </Button>

  {/* NEW: Become a Seller Button */}
  {!isSeller && (
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
      {hasPendingRequest ? 'Pending' : 'Become Seller'}
    </Button>
  )}

  <Button variant="default" className="justify-start" asChild>
    <Link to="/create-channel" onClick={closeSheet}>
      <Plus className="size-4 mr-2" />
      Create Channel
    </Link>
  </Button>
</nav>
```

## Acceptance Criteria
- [ ] Button shows only when user is logged in
- [ ] Button hidden if user already has active SELLER role
- [ ] Button shows "Become a Seller" text when idle
- [ ] Button shows "Pending" when request already submitted
- [ ] Button disabled during mutation (isPending)
- [ ] Button disabled when request is pending (activated_at = NULL)
- [ ] Clicking button calls trpc.role.requestSellerRole
- [ ] Success toast shows confirmation message
- [ ] Error toast shows error if request fails
- [ ] Button appears in both desktop and mobile navigation
- [ ] Mobile sheet closes after successful request

## User Flow

### Scenario 1: New BUYER requests SELLER role
1. User logs in (has only BUYER role)
2. NavBar shows "Become a Seller" button
3. User clicks button
4. API creates user_role with activated_at = NULL
5. Toast: "Seller role request submitted. Awaiting admin approval."
6. Button changes to "Pending" and becomes disabled

### Scenario 2: User with pending request
1. User logs in (has pending SELLER request)
2. NavBar shows disabled "Pending" button
3. User cannot click button
4. Tooltip (optional): "Your request is being reviewed"

### Scenario 3: Activated SELLER
1. Admin activates user's SELLER role in DB
2. User refreshes page or myRoles query refetches
3. Button disappears from NavBar
4. "Create Channel" button now works

### Scenario 4: Request fails (duplicate)
1. User clicks "Become a Seller"
2. API returns error: "Your seller request is pending approval"
3. Error toast appears
4. Button remains in pending state

## Testing Checklist

### Manual Tests
- [ ] Login as BUYER → See "Become a Seller" button
- [ ] Click button → Request submitted successfully
- [ ] Check database → user_role created with activated_at = NULL
- [ ] Refresh page → Button shows "Pending" and is disabled
- [ ] Click pending button → Nothing happens (disabled)
- [ ] Manually activate role in DB → Button disappears
- [ ] Login as SELLER → Button not visible
- [ ] Logout → Button not visible
- [ ] Test on mobile → Button works in Sheet menu
- [ ] Test on desktop → Button works in top nav

### Database Validation
```sql
-- Check pending request created
SELECT ur.*, r.name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = YOUR_USER_ID
AND r.name = 'SELLER';

-- Should show: activated_at = NULL, activated_by = NULL

-- Activate the request
UPDATE user_roles ur
SET activated_by = YOUR_USER_ID, activated_at = NOW()
WHERE ur.user_id = YOUR_USER_ID
AND ur.role_id = (SELECT id FROM roles WHERE name = 'SELLER');
```

## Styling Notes
Following STYLING.md conventions:
- Use Shadcn Button component with `variant="outline"`
- Use Lucide icon `BadgeCheck`
- Maintain consistent spacing with other nav buttons
- Use `size-4` for icons
- Use `mr-2` for icon-text gap
- Respect mobile-first responsive design
- Use design tokens (`bg-primary`, `text-foreground`, etc.)

## Status
✅ COMPLETED

## Implementation Notes
- Added BadgeCheck icon import from lucide-react
- Added useToast hook import
- Added userRoles query using trpc.role.myRoles
- Added requestSellerRole mutation with success/error handling
- Added helper functions: isSeller and hasPendingRequest
- Added handleRequestSellerRole function
- Added "Become a Seller" button to desktop navigation (between Shops and Create)
- Added "Become Seller" button to mobile Sheet menu (same position)
- Button shows only for non-sellers (buyers)
- Button shows "Pending" state when request exists but not activated
- Button disabled during mutation and when pending
- Toast notifications for success and error states
- Query invalidation on success to update UI state

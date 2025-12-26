# Phase 3: Frontend Integration

## Objective
Add "Become a Seller" button to navbar that allows users to request seller role, with proper state management and visual feedback.

## Files to Update

### Components
- `client/src/components/NavBar/NavBar.tsx` - Add seller request button

### Hooks
- `client/src/hooks/useUserRoles.ts` - NEW: Hook for managing user roles

### Types
- `client/src/types/roles.ts` - NEW: Frontend role types

### tRPC Client
- `client/src/utils/trpc.ts` - Already configured, no changes needed

## Type Definitions

### `client/src/types/roles.ts`
```typescript
export type RoleName = 'BUYER' | 'SELLER';

export interface UserRoleWithDetails {
  id: number;
  user_id: number;
  role_id: number;
  role_name: RoleName;
  activated_by: number | null;
  activated_by_email?: string | null;
  activated_at: Date | null;
  created_at: Date;
}

export interface RoleState {
  roles: UserRoleWithDetails[];
  hasActiveSeller: boolean;
  hasPendingSeller: boolean;
  isLoading: boolean;
}
```

## Custom Hook

### `client/src/hooks/useUserRoles.ts`
**Purpose**: Centralize role fetching and state management

**Returns**:
```typescript
{
  roles: UserRoleWithDetails[];
  hasActiveSeller: boolean;
  hasPendingSeller: boolean;
  isLoading: boolean;
  refetch: () => void;
  requestSellerRole: () => Promise<void>;
}
```

**Features**:
- Uses `trpc.role.getMyRoles.useQuery()` to fetch roles
- Computes `hasActiveSeller` (activated_at !== null)
- Computes `hasPendingSeller` (activated_at === null)
- Provides `requestSellerRole` mutation wrapper

## NavBar UI Integration

### Button States

**State 1: Not a Seller (No Request)**
```tsx
<Button 
  variant="outline" 
  onClick={handleRequestSeller}
  disabled={isLoading}
>
  <ShoppingBag className="mr-2 h-4 w-4" />
  Become a Seller
</Button>
```

**State 2: Pending Seller Request**
```tsx
<Button 
  variant="outline" 
  disabled
>
  <Clock className="mr-2 h-4 w-4" />
  Seller Request Pending
</Button>
```

**State 3: Active Seller**
```tsx
<Badge variant="default">
  <ShoppingBag className="mr-2 h-4 w-4" />
  Seller
</Badge>
```

### UI Placement
Add to mobile sheet menu and desktop navbar:
- **Desktop**: Next to user menu (before avatar/logout)
- **Mobile**: In SheetContent, below navigation links

### Icons to Use
- `<ShoppingBag />` - Seller/Commerce icon
- `<Clock />` - Pending state
- From `lucide-react`

## User Flow

1. **User clicks "Become a Seller"**
   - Call `requestSellerRole()` mutation
   - Show loading state on button

2. **Request succeeds**
   - Refetch user roles
   - Button changes to "Seller Request Pending" (disabled)
   - Show success toast: "Seller request submitted! We'll review it soon."

3. **Request fails**
   - Show error toast with message
   - Button returns to clickable state

4. **Admin approves in database**
   - On next page load or refetch, button becomes "Seller" badge
   - User can now create channels

## Steps

1. **Create types** (`client/src/types/roles.ts`)
   - Define RoleName, UserRoleWithDetails, RoleState

2. **Create useUserRoles hook** (`client/src/hooks/useUserRoles.ts`)
   - Fetch roles with tRPC query
   - Compute derived states
   - Wrap request mutation
   - Handle errors with toast

3. **Update NavBar** (`client/src/components/NavBar/NavBar.tsx`)
   - Import useUserRoles hook
   - Add conditional rendering for seller button/badge
   - Handle click to request seller role
   - Add to both desktop and mobile layouts

4. **Add toast notifications**
   - Success: "Seller request submitted"
   - Error: Display error message from API
   - Use existing toast setup (Shadcn)

## Design Considerations

### Visual Consistency
- Use Shadcn Button and Badge components
- Match existing navbar styling
- Ensure proper spacing and alignment

### Loading States
- Disable button while request is in progress
- Show loading indicator if needed
- Prevent duplicate requests

### Error Handling
- Handle network errors gracefully
- Show user-friendly error messages
- Allow retry on failure

## Acceptance Criteria
- [ ] "Become a Seller" button appears for non-sellers
- [ ] Button disabled with "Pending" state when request exists
- [ ] Badge shown when user has active seller role
- [ ] Clicking button successfully requests seller role
- [ ] Success toast shown on successful request
- [ ] Error toast shown on failure
- [ ] UI works on both desktop and mobile
- [ ] Role state updates after request without page refresh
- [ ] Types are properly defined and type-safe

## Testing

### Manual Testing
1. Log in as regular user (BUYER only)
2. Verify "Become a Seller" button appears
3. Click button, verify request sent
4. Verify button changes to "Pending" state
5. In database, set activated_at = NOW() for user_role
6. Refresh page, verify badge shows "Seller"
7. Verify channel creation now works

### Edge Cases
- User already has pending request → Show pending state
- User already is seller → Show badge
- Network error during request → Show error, allow retry
- Multiple rapid clicks → Debounce/disable button

## Status
📝 **PLANNING** - Ready to implement after Phase 2

## Notes
- Ensure tRPC router is registered before implementing frontend
- Test role checking in channel creation flow
- Consider adding seller badge to user profile as well (future enhancement)

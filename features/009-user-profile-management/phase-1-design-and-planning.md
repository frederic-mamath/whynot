# Phase 1: Design & Planning

## Objective

Define the user experience, data model, and API contracts for the user profile management feature, ensuring a smooth and intuitive interface for managing personal information and delivery addresses.

## User-Facing Changes

Users will have access to a dedicated **Profile Page** where they can:

- View and edit their first name and last name
- Add, edit, and delete delivery addresses
- Set a default delivery address for orders
- See their email address (read-only, set during registration)

### UI Flow

```
Navbar → User Menu → Profile
  ↓
Profile Page
  ├── Personal Information Section
  │   ├── Email (read-only, grayed out)
  │   ├── First Name (editable)
  │   └── Last Name (editable)
  │   └── [Save Changes Button]
  │
  └── Delivery Addresses Section
      ├── [+ Add New Address Button]
      ├── Address Card 1 (⭐ Default)
      ├── Address Card 2
      └── Address Card 3
          └── Actions: [Set as Default] [Edit] [Delete]
```

## Data Model

### Users Table Updates

Add columns to existing `users` table:

```typescript
interface User {
  id: number;
  email: string;
  // NEW FIELDS:
  firstName: string | null;
  lastName: string | null;
  // existing fields...
  createdAt: Date;
  updatedAt: Date;
}
```

### New UserAddresses Table

```typescript
interface UserAddress {
  id: number;
  userId: number; // Foreign key to users.id
  label: string; // e.g., "Home", "Work", "Parents"
  street: string;
  street2: string | null; // Apartment, suite, etc.
  city: string;
  state: string; // 2-letter state code
  zipCode: string;
  country: string; // Default: "US", future: international
  isDefault: boolean; // Only one per user can be true
  createdAt: Date;
  updatedAt: Date;
}
```

**Constraints**:

- One user can have multiple addresses
- Each user must have exactly one default address (if any addresses exist)
- Deleting the default address should auto-promote another to default (or prevent deletion if it's the only address)

## API Design

### tRPC Router: `profile`

#### `profile.getMe`

```typescript
// GET current user profile
profile.getMe.useQuery();
// Returns: { id, email, firstName, lastName }
```

#### `profile.updatePersonalInfo`

```typescript
// UPDATE first name and last name
profile.updatePersonalInfo.useMutation({
  firstName: string;
  lastName: string;
})
// Returns: Updated user object
```

#### `profile.listAddresses`

```typescript
// GET all addresses for current user
profile.listAddresses.useQuery();
// Returns: UserAddress[]
```

#### `profile.createAddress`

```typescript
// CREATE new address
profile.createAddress.useMutation({
  label: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean; // If true, unset previous default
})
// Returns: Created UserAddress
```

#### `profile.updateAddress`

```typescript
// UPDATE existing address
profile.updateAddress.useMutation({
  id: number;
  label?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
})
// Returns: Updated UserAddress
```

#### `profile.deleteAddress`

```typescript
// DELETE address
profile.deleteAddress.useMutation({
  id: number;
})
// Returns: Success message
// Validation: Cannot delete if it's the only address or if user has pending orders
```

#### `profile.setDefaultAddress`

```typescript
// SET address as default
profile.setDefaultAddress.useMutation({
  id: number;
})
// Returns: Updated UserAddress
// Side effect: Unsets previous default
```

## UI/UX Design Decisions

### Layout

- **Desktop**: Two-column layout with sidebar navigation (future: tabs for other settings)
- **Mobile**: Single column, stacked sections

### Components to Create

1. **ProfilePage** (`client/src/pages/ProfilePage.tsx`)
   - Main container page
   - Uses Card components from Shadcn

2. **PersonalInfoSection** (`client/src/components/profile/PersonalInfoSection.tsx`)
   - Form with firstName, lastName inputs
   - Email displayed as read-only (with lock icon)
   - Save button (disabled when no changes)

3. **AddressesSection** (`client/src/components/profile/AddressesSection.tsx`)
   - List of AddressCard components
   - "Add New Address" button (opens AddressDialog)

4. **AddressCard** (`client/src/components/profile/AddressCard.tsx`)
   - Display address in card format
   - Shows "Default" badge if `isDefault === true`
   - Actions dropdown: Set as Default, Edit, Delete

5. **AddressDialog** (`client/src/components/profile/AddressDialog.tsx`)
   - Modal dialog for create/edit address
   - Form with all address fields
   - Validation before submit

6. **DeleteAddressConfirmDialog** (`client/src/components/profile/DeleteAddressConfirmDialog.tsx`)
   - Confirmation dialog before deletion
   - Warning if deleting default address

### Styling Conventions

- Use **Shadcn UI components**:
  - `Card`, `CardHeader`, `CardContent` for sections
  - `Input` for text fields
  - `Button` for actions
  - `Dialog` for modals
  - `Badge` for "Default" indicator
  - `DropdownMenu` for address actions
  - `Label` for form labels
- **Icons from Lucide**:
  - `User` for profile
  - `MapPin` for addresses
  - `Lock` for read-only email
  - `Star` for default address
  - `Plus` for add address
  - `Edit`, `Trash2` for actions

- **Responsive Design**:
  - Mobile: Full width, vertical stacking
  - Desktop: Max width 800px, centered

### Form Validation

- **First Name**: Required, max 50 characters
- **Last Name**: Required, max 50 characters
- **Address Label**: Required, max 30 characters
- **Street**: Required, max 100 characters
- **City**: Required, max 50 characters
- **State**: Required, 2-letter code, dropdown
- **ZIP Code**: Required, 5 or 9 digits (format: 12345 or 12345-6789)
- **Country**: Required, default "US"

### Error Handling

- Display inline errors under each field
- Toast notifications for successful saves
- Alert dialog for deletion failures
- Loading states on all async actions

## Design Considerations

### Data Consistency

- When setting a new default address, backend must atomically unset the previous default
- Use database transaction to ensure consistency
- Prevent race conditions with proper locking

### User Experience

- Auto-save personal info changes (debounced)
- OR explicit "Save" button (clearer for users) ✅ **Recommended**
- Optimistic updates for better perceived performance
- Confirm before deleting addresses
- Show loading spinners during API calls

### Accessibility

- Proper `<label>` for all form inputs
- Keyboard navigation for all actions
- ARIA labels for icon buttons
- Focus management in dialogs
- Screen reader announcements for state changes

### Performance

- Lazy load ProfilePage to reduce initial bundle
- Cache profile data with tRPC
- Debounce form validation
- Optimistic updates for instant feedback

### Security

- Server-side validation of all inputs
- Sanitize address data to prevent XSS
- Ensure users can only modify their own data
- Rate limit address creation to prevent abuse

## Acceptance Criteria

- [ ] Data model documented with TypeScript interfaces
- [ ] API contracts defined with tRPC types
- [ ] UI mockups created (or detailed description)
- [ ] Component structure planned
- [ ] Validation rules specified
- [ ] Error handling strategy defined
- [ ] Accessibility considerations documented
- [ ] Mobile responsive design planned
- [ ] Icons selected from Lucide
- [ ] Shadcn components identified

## Testing Checklist

- [ ] UI flow walkthrough completed
- [ ] Edge cases identified (no addresses, only one address, etc.)
- [ ] Validation rules reviewed
- [ ] API contracts validated with backend team (if applicable)

## Status

✅ **DONE** - Design and planning completed, ready for backend implementation

## Notes

- Consider adding "Billing Address" vs "Shipping Address" distinction in future phases
- Address validation could be enhanced with Google Places API autocomplete
- Consider address verification service (USPS, SmartyStreets) for production
- Future: Support international addresses with different formats
- Consider pagination if users have many addresses (unlikely, but good practice)

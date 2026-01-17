# Phase 3: Frontend Implementation

## Objective

Build the ProfilePage and all related UI components using React, Shadcn UI, and Tailwind CSS to enable users to manage their personal information and delivery addresses.

## User-Facing Changes

Users will have access to a fully functional **Profile Page** accessible from the navbar:

1. **Personal Information Section**:
   - View email (read-only)
   - Edit first name and last name
   - Save button with loading state

2. **Delivery Addresses Section**:
   - List all saved addresses
   - See which address is default (⭐ badge)
   - Add new addresses via dialog
   - Edit existing addresses
   - Delete addresses (with confirmation)
   - Set an address as default

3. **Responsive Design**:
   - Mobile: Full-width, stacked layout
   - Desktop: Centered card layout (max 800px)

## Files to Update

### Pages

- `client/src/pages/ProfilePage.tsx` - **NEW** Main profile page container

### Components

- `client/src/components/profile/PersonalInfoSection.tsx` - **NEW** Personal info form
- `client/src/components/profile/AddressesSection.tsx` - **NEW** Address list container
- `client/src/components/profile/AddressCard.tsx` - **NEW** Individual address display
- `client/src/components/profile/AddressDialog.tsx` - **NEW** Add/edit address modal
- `client/src/components/profile/DeleteAddressDialog.tsx` - **NEW** Delete confirmation
- `client/src/components/profile/index.ts` - **NEW** Barrel export

### Navigation

- `client/src/components/Navbar.tsx` - **UPDATE** Add profile link to user menu

### Routing

- `client/src/App.tsx` - **UPDATE** Add `/profile` route

### Types

- `client/src/types/profile.ts` - **NEW** Frontend types (mirror backend)

## Steps

### Step 1: Create Frontend Types

**File**: `client/src/types/profile.ts`

```typescript
export interface UserProfile {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface UserAddress {
  id: number;
  userId: number;
  label: string;
  street: string;
  street2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressFormData {
  label: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  // ... all 50 states
  { value: "WY", label: "Wyoming" },
];
```

### Step 2: Create ProfilePage

**File**: `client/src/pages/ProfilePage.tsx`

```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { isAuthenticated } from "../lib/auth";
import PersonalInfoSection from "../components/profile/PersonalInfoSection";
import AddressesSection from "../components/profile/AddressesSection";

export default function ProfilePage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground">
                Manage your personal information and delivery addresses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <PersonalInfoSection />
        <AddressesSection />
      </div>
    </div>
  );
}
```

### Step 3: Create PersonalInfoSection

**File**: `client/src/components/profile/PersonalInfoSection.tsx`

```tsx
import { useState } from "react";
import { Lock, Save } from "lucide-react";
import { trpc } from "../../lib/trpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { toast } from "sonner";

export default function PersonalInfoSection() {
  const { data: profile, isLoading, refetch } = trpc.profile.getMe.useQuery();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = trpc.profile.updatePersonalInfo.useMutation({
    onSuccess: () => {
      toast.success("Personal information updated!");
      setHasChanges(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ firstName, lastName });
  };

  const handleInputChange = (
    field: "firstName" | "lastName",
    value: string,
  ) => {
    if (field === "firstName") setFirstName(value);
    if (field === "lastName") setLastName(value);

    setHasChanges(
      value !== profile?.[field] ||
        (field === "firstName" && lastName !== profile?.lastName) ||
        (field === "lastName" && firstName !== profile?.firstName),
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your name and view your account email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              Email
              <Lock className="size-3 text-muted-foreground" />
            </Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              placeholder="Enter your first name"
              maxLength={50}
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              placeholder="Enter your last name"
              maxLength={50}
              required
            />
          </div>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={!hasChanges || updateMutation.isLoading}
            className="w-full md:w-auto"
          >
            {updateMutation.isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Create AddressesSection

**File**: `client/src/components/profile/AddressesSection.tsx`

```tsx
import { useState } from "react";
import { Plus } from "lucide-react";
import { trpc } from "../../lib/trpc";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import AddressCard from "./AddressCard";
import AddressDialog from "./AddressDialog";
import { UserAddress } from "../../types/profile";

export default function AddressesSection() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );

  const {
    data: addresses = [],
    isLoading,
    refetch,
  } = trpc.profile.listAddresses.useQuery();

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddDialogOpen(true);
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingAddress(null);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Delivery Addresses</CardTitle>
              <CardDescription>
                Manage addresses for product delivery
              </CardDescription>
            </div>
            <Button onClick={handleAddAddress} size="sm">
              <Plus className="size-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No addresses saved yet
              </p>
              <Button onClick={handleAddAddress} variant="outline">
                <Plus className="size-4 mr-2" />
                Add Your First Address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={handleEditAddress}
                  onDeleted={refetch}
                  onDefaultChanged={refetch}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddressDialog
        isOpen={isAddDialogOpen}
        onClose={handleCloseDialog}
        address={editingAddress}
      />
    </>
  );
}
```

### Step 5: Create AddressCard

**File**: `client/src/components/profile/AddressCard.tsx`

```tsx
import { useState } from "react";
import { MapPin, Star, Edit, Trash2, MoreVertical } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DeleteAddressDialog from "./DeleteAddressDialog";
import { UserAddress } from "../../types/profile";
import { toast } from "sonner";

interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDeleted: () => void;
  onDefaultChanged: () => void;
}

export default function AddressCard({
  address,
  onEdit,
  onDeleted,
  onDefaultChanged,
}: AddressCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const setDefaultMutation = trpc.profile.setDefaultAddress.useMutation({
    onSuccess: () => {
      toast.success("Default address updated!");
      onDefaultChanged();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetDefault = () => {
    setDefaultMutation.mutate({ id: address.id });
  };

  return (
    <>
      <Card className={address.isDefault ? "border-primary" : ""}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="size-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{address.label}</span>
                  {address.isDefault && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Star className="size-3 fill-current" />
                      Default
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{address.street}</p>
                  {address.street2 && <p>{address.street2}</p>}
                  <p>
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  <p>{address.country}</p>
                </div>
              </div>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!address.isDefault && (
                  <DropdownMenuItem onClick={handleSetDefault}>
                    <Star className="size-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(address)}>
                  <Edit className="size-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <DeleteAddressDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        address={address}
        onDeleted={onDeleted}
      />
    </>
  );
}
```

### Step 6: Create AddressDialog

**File**: `client/src/components/profile/AddressDialog.tsx`

```tsx
import { useState, useEffect } from "react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { UserAddress, US_STATES } from "../../types/profile";
import { toast } from "sonner";

interface AddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address?: UserAddress | null;
}

export default function AddressDialog({
  isOpen,
  onClose,
  address,
}: AddressDialogProps) {
  const isEditing = !!address;

  const [formData, setFormData] = useState({
    label: "",
    street: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    isDefault: false,
  });

  // Initialize form when address changes
  useEffect(() => {
    if (address) {
      setFormData({
        label: address.label,
        street: address.street,
        street2: address.street2 || "",
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        isDefault: address.isDefault,
      });
    } else {
      // Reset form for new address
      setFormData({
        label: "",
        street: "",
        street2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        isDefault: false,
      });
    }
  }, [address, isOpen]);

  const createMutation = trpc.profile.createAddress.useMutation({
    onSuccess: () => {
      toast.success("Address added successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.profile.updateAddress.useMutation({
    onSuccess: () => {
      toast.success("Address updated successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      updateMutation.mutate({ id: address.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your delivery address details"
              : "Add a new delivery address for your orders"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="e.g., Home, Work, Parents"
              maxLength={30}
              required
            />
          </div>

          {/* Street */}
          <div className="space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              placeholder="123 Main St"
              maxLength={100}
              required
            />
          </div>

          {/* Street 2 */}
          <div className="space-y-2">
            <Label htmlFor="street2">Apartment, Suite, etc.</Label>
            <Input
              id="street2"
              value={formData.street2}
              onChange={(e) =>
                setFormData({ ...formData, street2: e.target.value })
              }
              placeholder="Apt 4B (optional)"
              maxLength={100}
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="New York"
              maxLength={50}
              required
            />
          </div>

          {/* State & ZIP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({ ...formData, state: value })
                }
                required
              >
                <SelectTrigger id="state">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData({ ...formData, zipCode: e.target.value })
                }
                placeholder="12345"
                pattern="\d{5}(-\d{4})?"
                maxLength={10}
                required
              />
            </div>
          </div>

          {/* Default Checkbox */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked as boolean })
                }
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default delivery address
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update" : "Add Address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 7: Create DeleteAddressDialog

**File**: `client/src/components/profile/DeleteAddressDialog.tsx`

```tsx
import { trpc } from "../../lib/trpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { UserAddress } from "../../types/profile";
import { toast } from "sonner";

interface DeleteAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address: UserAddress;
  onDeleted: () => void;
}

export default function DeleteAddressDialog({
  isOpen,
  onClose,
  address,
  onDeleted,
}: DeleteAddressDialogProps) {
  const deleteMutation = trpc.profile.deleteAddress.useMutation({
    onSuccess: () => {
      toast.success("Address deleted successfully");
      onDeleted();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: address.id });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Address</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the address{" "}
            <strong>{address.label}</strong>?
            {address.isDefault && (
              <span className="block mt-2 text-warning">
                This is your default address. Another address will be set as
                default automatically.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {deleteMutation.isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Step 8: Update Navbar

**File**: `client/src/components/Navbar.tsx`

Add profile link to user menu (usually in a dropdown):

```tsx
import { User } from "lucide-react";
import { Link } from "react-router-dom";

// Inside the user menu dropdown:
<DropdownMenuItem asChild>
  <Link to="/profile" className="flex items-center">
    <User className="size-4 mr-2" />
    Profile
  </Link>
</DropdownMenuItem>;
```

### Step 9: Add Route

**File**: `client/src/App.tsx`

```tsx
import ProfilePage from "./pages/ProfilePage";

// In your Routes:
<Route path="/profile" element={<ProfilePage />} />;
```

### Step 10: Create Barrel Export

**File**: `client/src/components/profile/index.ts`

```typescript
export { default as PersonalInfoSection } from "./PersonalInfoSection";
export { default as AddressesSection } from "./AddressesSection";
export { default as AddressCard } from "./AddressCard";
export { default as AddressDialog } from "./AddressDialog";
export { default as DeleteAddressDialog } from "./DeleteAddressDialog";
```

## Design Considerations

### State Management

- Use tRPC queries for data fetching with automatic caching
- Refetch data after mutations to ensure consistency
- Optimistic updates not used initially (simpler, more reliable)

### Form Validation

- Required fields enforced with HTML5 `required` attribute
- ZIP code pattern validation: `\d{5}(-\d{4})?`
- Max lengths enforced on all text inputs
- State selection via dropdown (prevents typos)

### User Experience

- Loading states for all async operations
- Toast notifications for success/error feedback
- Confirmation dialog before deleting addresses
- Clear visual indicator for default address (⭐ badge + border)
- Disabled save button when no changes made

### Accessibility

- Proper `<label>` elements for all inputs
- Semantic HTML (buttons, forms, dialogs)
- Keyboard navigation support (all Shadcn components are accessible)
- Focus management in dialogs
- ARIA labels via Shadcn components

### Responsive Design

- Mobile-first approach
- Full-width inputs on mobile
- Two-column grid for state/ZIP on larger screens
- Scrollable dialog content for small screens
- Max width container for desktop (800px)

### Error Handling

- Display tRPC errors via toast notifications
- Form validation errors shown inline
- Graceful handling of network failures
- Clear error messages for users

## Acceptance Criteria

- [ ] ProfilePage renders correctly
- [ ] Can view current profile info (email, name)
- [ ] Can update first and last name
- [ ] Email is read-only and disabled
- [ ] Can add new delivery addresses
- [ ] Can edit existing addresses
- [ ] Can delete non-default addresses
- [ ] Can set an address as default
- [ ] Default address has visual indicator
- [ ] Deleting default auto-promotes another
- [ ] Cannot delete only address (error shown)
- [ ] Form validation works (required fields, ZIP format)
- [ ] Loading states display correctly
- [ ] Toast notifications appear for all actions
- [ ] Mobile responsive (tested on phone)
- [ ] Desktop layout looks good (centered, max-width)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly (test with VoiceOver/NVDA)
- [ ] All Lucide icons render correctly
- [ ] Follows STYLING.md conventions

## Testing Checklist

- [ ] Manual testing on Chrome
- [ ] Manual testing on Safari
- [ ] Mobile testing (iOS/Android)
- [ ] Test with no addresses (empty state)
- [ ] Test with one address
- [ ] Test with multiple addresses
- [ ] Test switching default address
- [ ] Test deleting default address
- [ ] Test form validation errors
- [ ] Test network errors (offline mode)
- [ ] Test with screen reader
- [ ] Test keyboard-only navigation
- [ ] Test responsive breakpoints

## Status

📝 **PLANNING** - Ready to implement

## Notes

- Import `useEffect` in PersonalInfoSection (missing in code snippet above)
- Consider adding loading skeleton for better perceived performance
- Future: Add profile photo upload
- Future: Add phone number field for delivery notifications
- Consider address autocomplete (Google Places API) for better UX

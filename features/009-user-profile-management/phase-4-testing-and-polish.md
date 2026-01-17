# Phase 4: Testing & Polish

## Objective

Ensure the user profile management feature is thoroughly tested, accessible, performant, and ready for production deployment with comprehensive test coverage and quality assurance.

## User-Facing Changes

Users will experience a polished, bug-free profile management interface with:

- Fast page loads and responsive interactions
- Clear error messages and helpful validation
- Smooth animations and transitions
- Full accessibility support
- Consistent behavior across browsers and devices

## Files to Update

### Test Files (New)

- `client/src/pages/__tests__/ProfilePage.test.tsx` - **NEW** Page integration tests
- `client/src/components/profile/__tests__/PersonalInfoSection.test.tsx` - **NEW** Component tests
- `client/src/components/profile/__tests__/AddressCard.test.tsx` - **NEW** Component tests
- `client/src/components/profile/__tests__/AddressDialog.test.tsx` - **NEW** Component tests
- `src/routers/__tests__/profileRouter.test.ts` - **NEW** Backend API tests
- `src/repositories/__tests__/AddressRepository.test.ts` - **NEW** Repository tests

### Polish Updates

- `client/src/pages/ProfilePage.tsx` - **UPDATE** Add loading skeletons, animations
- `client/src/components/profile/*.tsx` - **UPDATE** Polish transitions, error states

### Documentation

- `README.md` - **UPDATE** Add profile feature to feature list

## Steps

### Step 1: Backend Unit Tests

#### AddressRepository Tests

**File**: `src/repositories/__tests__/AddressRepository.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { AddressRepository } from "../AddressRepository";
// Mock database setup...

describe("AddressRepository", () => {
  let repo: AddressRepository;

  beforeEach(() => {
    // Setup test database
  });

  it("should create a new address", async () => {
    const address = await repo.create(1, {
      label: "Home",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US",
    });

    expect(address.label).toBe("Home");
    expect(address.userId).toBe(1);
  });

  it("should set only one default address per user", async () => {
    await repo.create(1, { /* ... */, isDefault: true });
    await repo.create(1, { /* ... */, isDefault: true });

    const addresses = await repo.findByUserId(1);
    const defaults = addresses.filter(a => a.isDefault);
    expect(defaults.length).toBe(1);
  });

  it("should delete address", async () => {
    const address = await repo.create(1, { /* ... */ });
    await repo.delete(address.id, 1);

    const found = await repo.findById(address.id, 1);
    expect(found).toBeNull();
  });

  it("should prevent deleting only address", async () => {
    // Test handled in router layer
  });
});
```

#### Profile Router Tests

**File**: `src/routers/__tests__/profileRouter.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { createCaller } from "../../trpc";

describe("profileRouter", () => {
  it("should return current user profile", async () => {
    const caller = await createCaller(/* mock context */);
    const profile = await caller.profile.getMe();

    expect(profile).toHaveProperty("email");
    expect(profile).toHaveProperty("firstName");
  });

  it("should update personal info", async () => {
    const caller = await createCaller(/* mock context */);
    const updated = await caller.profile.updatePersonalInfo({
      firstName: "John",
      lastName: "Doe",
    });

    expect(updated.firstName).toBe("John");
    expect(updated.lastName).toBe("Doe");
  });

  it("should create address", async () => {
    const caller = await createCaller(/* mock context */);
    const address = await caller.profile.createAddress({
      label: "Work",
      street: "456 Office Blvd",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "US",
    });

    expect(address.label).toBe("Work");
  });

  it("should prevent deleting only address", async () => {
    const caller = await createCaller(/* mock context */);
    // Create one address
    const address = await caller.profile.createAddress({ /* ... */ });

    // Attempt to delete it
    await expect(
      caller.profile.deleteAddress({ id: address.id })
    ).rejects.toThrow("Cannot delete your only address");
  });

  it("should auto-promote when deleting default address", async () => {
    const caller = await createCaller(/* mock context */);

    // Create two addresses
    const addr1 = await caller.profile.createAddress({ /* ... */, isDefault: true });
    const addr2 = await caller.profile.createAddress({ /* ... */ });

    // Delete default
    await caller.profile.deleteAddress({ id: addr1.id });

    // Check addr2 is now default
    const addresses = await caller.profile.listAddresses();
    expect(addresses.length).toBe(1);
    expect(addresses[0].isDefault).toBe(true);
  });
});
```

### Step 2: Frontend Component Tests

#### PersonalInfoSection Tests

**File**: `client/src/components/profile/__tests__/PersonalInfoSection.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PersonalInfoSection from "../PersonalInfoSection";
import { trpc } from "../../../lib/trpc";

vi.mock("../../../lib/trpc");

describe("PersonalInfoSection", () => {
  it("should render email as read-only", () => {
    render(<PersonalInfoSection />);
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeDisabled();
  });

  it("should enable save button when changes are made", async () => {
    render(<PersonalInfoSection />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const saveButton = screen.getByRole("button", { name: /save/i });

    expect(saveButton).toBeDisabled();

    fireEvent.change(firstNameInput, { target: { value: "John" } });

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it("should submit form with updated values", async () => {
    const mockMutate = vi.fn();
    trpc.profile.updatePersonalInfo.useMutation.mockReturnValue({
      mutate: mockMutate,
    });

    render(<PersonalInfoSection />);

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mockMutate).toHaveBeenCalledWith({
      firstName: "John",
      lastName: "Doe",
    });
  });
});
```

#### AddressCard Tests

**File**: `client/src/components/profile/__tests__/AddressCard.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AddressCard from "../AddressCard";

describe("AddressCard", () => {
  const mockAddress = {
    id: 1,
    userId: 1,
    label: "Home",
    street: "123 Main St",
    street2: null,
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US",
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("should display address information", () => {
    render(<AddressCard address={mockAddress} onEdit={vi.fn()} onDeleted={vi.fn()} onDefaultChanged={vi.fn()} />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText(/New York, NY 10001/)).toBeInTheDocument();
  });

  it("should show default badge when isDefault is true", () => {
    render(
      <AddressCard
        address={{ ...mockAddress, isDefault: true }}
        onEdit={vi.fn()}
        onDeleted={vi.fn()}
        onDefaultChanged={vi.fn()}
      />
    );

    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("should call onEdit when edit is clicked", () => {
    const mockEdit = vi.fn();
    render(<AddressCard address={mockAddress} onEdit={mockEdit} onDeleted={vi.fn()} onDefaultChanged={vi.fn()} />);

    // Open dropdown menu
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Edit"));

    expect(mockEdit).toHaveBeenCalledWith(mockAddress);
  });
});
```

### Step 3: Integration Tests

#### ProfilePage E2E Test

**File**: `client/src/pages/__tests__/ProfilePage.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProfilePage from "../ProfilePage";

describe("ProfilePage Integration", () => {
  it("should render both sections", () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Delivery Addresses")).toBeInTheDocument();
  });

  it("should show empty state when no addresses", async () => {
    // Mock empty addresses
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No addresses saved yet/i)).toBeInTheDocument();
    });
  });

  it("should open add address dialog when clicking add button", async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /add address/i }));

    await waitFor(() => {
      expect(screen.getByText("Add New Address")).toBeInTheDocument();
    });
  });
});
```

### Step 4: Manual QA Checklist

**Cross-browser Testing**:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Device Testing**:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone, Android)

**Functional Testing**:

- [ ] Can navigate to /profile from navbar
- [ ] Personal info loads correctly
- [ ] Email is read-only and grayed out
- [ ] Can update first and last name
- [ ] Save button disabled when no changes
- [ ] Success toast appears after saving
- [ ] Empty state shows when no addresses
- [ ] Can add first address
- [ ] Can add multiple addresses
- [ ] Default badge shows on default address
- [ ] Can edit address
- [ ] Can delete non-default address
- [ ] Can set different address as default
- [ ] Cannot delete only address (error shown)
- [ ] Deleting default auto-promotes another
- [ ] Form validation works (required fields)
- [ ] ZIP code validation works
- [ ] State dropdown populates correctly
- [ ] Error toast appears on API failures

**Accessibility Testing**:

- [ ] All inputs have labels
- [ ] Can navigate with keyboard only
- [ ] Tab order is logical
- [ ] Dialogs trap focus correctly
- [ ] Screen reader announces form errors
- [ ] Screen reader announces toast messages
- [ ] Buttons have accessible names
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible

**Performance Testing**:

- [ ] Page loads in < 1 second
- [ ] No layout shift on load
- [ ] Smooth animations (60fps)
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works offline (shows appropriate errors)

### Step 5: Polish & UX Improvements

#### Add Loading Skeletons

Update ProfilePage.tsx to show better loading states:

```tsx
// While profile is loading
{
  isLoading && (
    <div className="space-y-8">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Add Smooth Transitions

```tsx
// In AddressCard
<Card className={cn(
  "transition-all duration-200",
  address.isDefault ? "border-primary shadow-sm" : ""
)}>
```

#### Improve Error Messages

```tsx
// Better validation messages
const validateZipCode = (zip: string) => {
  if (!/^\d{5}(-\d{4})?$/.test(zip)) {
    return "ZIP code must be 5 or 9 digits (e.g., 12345 or 12345-6789)";
  }
  return null;
};
```

#### Add Confirmation for Unsaved Changes

```tsx
// Warn before leaving with unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [hasChanges]);
```

### Step 6: Performance Optimization

#### Lazy Load ProfilePage

```tsx
// In App.tsx
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// In Routes
<Route
  path="/profile"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <ProfilePage />
    </Suspense>
  }
/>;
```

#### Debounce Form Changes

```tsx
import { useDebouncedCallback } from "use-debounce";

const debouncedValidation = useDebouncedCallback((value) => {
  validateField(value);
}, 300);
```

#### Optimize Re-renders

```tsx
// Memoize address cards
const AddressCard = memo(({ address, ...props }: AddressCardProps) => {
  // ...
});
```

### Step 7: Documentation Updates

#### Update README.md

```markdown
### User Profile Management

- Users can update their first and last name
- Manage multiple delivery addresses
- Set a default address for orders
- Required for completing auction purchases
```

#### Add JSDoc Comments

```tsx
/**
 * ProfilePage - Main user profile management page
 *
 * Allows users to:
 * - Update personal information (first name, last name)
 * - Manage delivery addresses
 * - Set default delivery address
 *
 * @requires Authentication
 */
export default function ProfilePage() {
  /* ... */
}
```

## Acceptance Criteria

### Functionality

- [ ] All backend tests pass
- [ ] All frontend tests pass
- [ ] Integration tests pass
- [ ] Manual QA checklist completed
- [ ] No console errors or warnings
- [ ] Works across all supported browsers
- [ ] Works on mobile and desktop

### Performance

- [ ] Page load time < 1 second
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 2s
- [ ] No layout shifts (CLS < 0.1)
- [ ] 60fps animations

### Accessibility

- [ ] WCAG AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes
- [ ] Focus indicators visible

### Code Quality

- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Code follows project conventions
- [ ] Components are properly documented
- [ ] No unnecessary re-renders

## Testing Checklist

- [ ] Backend unit tests written and passing
- [ ] Repository tests written and passing
- [ ] Router tests written and passing
- [ ] Frontend component tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed on all browsers
- [ ] Mobile testing completed
- [ ] Accessibility testing completed
- [ ] Performance testing completed
- [ ] Load testing (concurrent users)

## Status

📝 **PLANNING** - Ready to execute

## Notes

- Consider adding Playwright E2E tests for critical flows
- Monitor error rates in production after launch
- Set up analytics to track feature usage
- Consider A/B testing different layouts
- Plan follow-up: profile photo upload

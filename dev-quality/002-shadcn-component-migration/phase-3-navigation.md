# Phase 3: Migrate Navigation & Layout

## Objective
Convert NavBar component to use Shadcn Button and Lucide icons, creating a modern, professional navigation experience.

## Files to Update

1. `client/src/components/NavBar/NavBar.tsx`

## Steps

### 1. Replace Button Elements
- Replace all `<button>` with Shadcn `<Button>`
- Use appropriate variants: `ghost`, `outline`, `default`
- Use appropriate sizes for navigation

### 2. Add Lucide Icons
- Replace icons/emojis with Lucide icons:
  - Home/Dashboard: `Home`
  - Channels: `Video`
  - Create: `Plus` or `PlusCircle`
  - User profile: `User`
  - Logout: `LogOut`
  - Login: `LogIn`
  - Register: `UserPlus`

### 3. Apply Tailwind Layout
- Use Tailwind utilities for flexbox layout
- Ensure responsive design with `md:` breakpoints
- Apply proper spacing with gap utilities

### 4. Use Design Tokens
- Background: `bg-background` or custom nav color
- Border: `border-border`
- Text: `text-foreground`
- Ensure proper contrast

### 5. Mobile Menu (Optional Enhancement)
- Add `Menu` and `X` icons from Lucide
- Create collapsible mobile menu
- Use `Sheet` component if available (or build simple solution)

## Design Considerations

### Navigation Structure
```tsx
<nav className="border-b border-border bg-background">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo/Brand */}
      <Link to="/" className="flex items-center gap-2">
        <Video className="size-6" />
        <span className="text-xl font-bold">NotWhat</span>
      </Link>
      
      {/* Navigation Links */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/channels">
            <Video className="size-4 mr-2" />
            Channels
          </Link>
        </Button>
        {/* More buttons... */}
      </div>
    </div>
  </div>
</nav>
```

### Button Variants
- Navigation links: `variant="ghost"`
- Primary actions (Create): `variant="default"` or `variant="outline"`
- User profile: `variant="ghost"` with Avatar
- Logout: `variant="ghost"` or `variant="destructive"`

### Responsive Behavior
- Desktop: Show all links horizontally
- Mobile: Consider hamburger menu or simplified layout
- Use `hidden md:flex` and `md:hidden` for responsive visibility

## Acceptance Criteria

- [ ] All `<button>` replaced with Shadcn `<Button>`
- [ ] All navigation items have Lucide icons
- [ ] Logo/brand uses appropriate icon
- [ ] Layout uses Tailwind utilities (no custom CSS)
- [ ] Design tokens used for colors
- [ ] Navigation is mobile responsive
- [ ] Active link styling (if applicable)
- [ ] All navigation links work correctly
- [ ] User profile display works
- [ ] Logout functionality works
- [ ] No TypeScript errors
- [ ] No layout shift or visual bugs

## Testing Checklist

- [ ] Navigate to all pages from NavBar
- [ ] Verify active link highlighting (if implemented)
- [ ] Test on desktop viewport
- [ ] Test on tablet viewport
- [ ] Test on mobile viewport
- [ ] Click all buttons and verify actions
- [ ] Verify user profile displays correctly
- [ ] Logout works and redirects properly

## Status
✅ **DONE** - NavBar completely migrated

## Completed Tasks

- [x] All `<button>` replaced with Shadcn `<Button>`
- [x] All navigation items have Lucide icons
- [x] Logo/brand uses `Video` icon with primary color
- [x] Layout uses Tailwind utilities (no custom CSS)
- [x] Design tokens used for colors
- [x] Navigation is mobile responsive
- [x] Active state styling for authenticated/unauthenticated
- [x] All navigation links work correctly
- [x] User profile display works with avatar circle
- [x] Logout functionality works
- [x] No TypeScript errors
- [x] No layout shift or visual bugs

## Implementation Details

### Icons Added
- **Logo**: `Video` (brand)
- **Dashboard**: `Home`
- **Channels**: `Video`
- **Create**: `Plus`
- **Logout**: `LogOut`
- **Login**: `LogIn`
- **Sign Up**: `UserPlus`
- **User Avatar**: First letter in circular badge

### Button Variants Used
- **Navigation links** (Dashboard, Channels): `variant="ghost" size="sm"`
- **Primary actions** (Create, Sign Up): `variant="default" size="sm"`
- **Secondary actions** (Login, Logout): `variant="ghost" size="sm"`

### Layout Features
- Fixed height navigation: `h-16`
- Max width container: `max-w-7xl mx-auto`
- Responsive padding: `px-4 sm:px-6 lg:px-8`
- Flexbox layout: `flex items-center justify-between`
- User email hidden on mobile: `hidden md:inline`
- Border separator for user section: `border-l border-border`

### User Profile
- Circular avatar with first letter: `size-8 rounded-full bg-primary`
- Email displayed on desktop only
- Accent background for profile section: `bg-accent`

## Estimated Time
1.5 hours

**Actual Time**: ~15 minutes

## Notes
- NavBar is visible on all pages - test thoroughly
- Consider adding Avatar component for user profile (may need to create in Phase 1)
- Keep existing responsive behavior
- Don't break authentication state display

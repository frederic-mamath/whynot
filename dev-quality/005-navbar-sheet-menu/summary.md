# Track 005: NavBar Sheet Menu Implementation

## Objective
Replace the current mobile menu dropdown in NavBar with Shadcn's Sheet component that slides in from the right side of the screen, providing a better mobile/tablet experience.

## Current State
- NavBar uses a simple conditional rendering (`{mobileMenuOpen && <div>...`) for mobile menu
- Mobile menu appears below the navbar with basic fade-in
- Works on mobile but lacks polish and animations
- Desktop navigation remains unchanged (horizontal menu)

## Desired State
- Mobile menu opens in a Sheet component (slide-in from right)
- Smooth animations and backdrop overlay
- Better UX with close button and overlay click-to-close
- Consistent with modern mobile app patterns
- Desktop navigation unchanged (Sheet only for mobile/tablet)

## Technical Approach
- Use existing `client/src/components/ui/sheet.tsx` (already installed)
- Sheet component from Radix UI Dialog primitive
- Sheet will be triggered by the Menu icon button
- Side prop set to `"right"` for right-side slide-in
- Reuse existing menu items and logic

## Progress Tracking
| Phase | Description | Status | Estimated Time |
|-------|-------------|--------|----------------|
| Phase 1 | Import and Setup Sheet Component | ⏳ Pending | 20 min |
| Phase 2 | Refactor Mobile Menu UI | ⏳ Pending | 30 min |
| Phase 3 | Testing and Polish | ⏳ Pending | 20 min |

## Components/Files Affected
- `client/src/components/NavBar/NavBar.tsx` - Main refactoring
- `client/src/components/ui/sheet.tsx` - Already exists (no changes)

## Phases

### Phase 1: Import and Setup Sheet Component (20 min)
**Objective**: Import Sheet components and set up basic structure

**Changes**:
1. Import Sheet components from `../ui/sheet`
2. Replace `mobileMenuOpen` state with Sheet's controlled state
3. Set up Sheet structure with SheetTrigger and SheetContent

**Files**:
- `client/src/components/NavBar/NavBar.tsx`

**Steps**:
1. Add imports: `Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle`
2. Wrap Menu button with SheetTrigger
3. Create SheetContent with `side="right"`
4. Keep existing menu items for now

**Acceptance Criteria**:
- Sheet opens when clicking Menu button
- Sheet slides in from the right
- Desktop menu unchanged

### Phase 2: Refactor Mobile Menu UI (30 min)
**Objective**: Move menu items into Sheet and improve layout

**Changes**:
1. Move all mobile menu items into SheetContent
2. Add SheetHeader with title and close button
3. Update styling for Sheet context
4. Ensure proper spacing and padding
5. Update close handlers to work with Sheet

**Files**:
- `client/src/components/NavBar/NavBar.tsx`

**Steps**:
1. Create SheetHeader with "Menu" title
2. Move user profile section into Sheet
3. Move navigation buttons into Sheet
4. Adjust button variants and sizes for vertical layout
5. Update `closeMobileMenu` to close Sheet
6. Remove old conditional mobile menu rendering

**Acceptance Criteria**:
- All menu items appear in Sheet
- Proper spacing and alignment
- Close button works
- Clicking overlay closes Sheet
- Navigation links close Sheet on click

### Phase 3: Testing and Polish (20 min)
**Objective**: Test across devices and polish animations

**Changes**:
1. Test on different screen sizes
2. Verify animations are smooth
3. Ensure accessibility (keyboard navigation, focus trap)
4. Check z-index layering
5. Verify no layout shifts

**Files**:
- `client/src/components/NavBar/NavBar.tsx`

**Steps**:
1. Test mobile (< 768px)
2. Test tablet (768px - 1024px)
3. Test desktop (> 1024px) - should not show Sheet
4. Test keyboard navigation (Tab, Escape)
5. Test with screen reader if possible
6. Verify logout flow works correctly

**Acceptance Criteria**:
- Works on all screen sizes
- Animations are smooth (60fps)
- No console errors
- Keyboard accessible
- Focus management works correctly
- No layout shifts when opening/closing

## Success Criteria
- ✅ Sheet opens from right side on mobile/tablet
- ✅ Smooth slide-in/out animations
- ✅ Backdrop overlay with blur effect
- ✅ Close on overlay click
- ✅ Close on navigation click
- ✅ Desktop menu unaffected
- ✅ All existing functionality preserved
- ✅ Keyboard accessible (Escape to close, Tab navigation)
- ✅ No layout shifts or visual bugs

## Status
⏳ **PENDING** - Ready to start

## Design Notes
- Sheet width: `w-3/4` on mobile, `sm:max-w-sm` (320px) on larger screens
- Animation: Slide from right with fade-in backdrop
- Overlay: Black with 80% opacity (`bg-black/80`)
- Content: Same menu items as current mobile menu
- User profile: Show at top of Sheet (if authenticated)
- Logout: Show at bottom with red text color

## Example Structure
```tsx
<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="size-5" />
    </Button>
  </SheetTrigger>
  
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Menu</SheetTitle>
    </SheetHeader>
    
    {/* User profile section */}
    {/* Navigation links */}
    {/* Logout button */}
  </SheetContent>
</Sheet>
```

## Notes
- Keep state management simple (boolean open/close)
- Reuse existing menu items and logic
- Focus on mobile experience (md: breakpoint and below)
- Desktop navigation remains horizontal (unchanged)
- Sheet already installed (no npx shadcn-ui add needed)
- Estimated total time: ~1 hour 10 minutes

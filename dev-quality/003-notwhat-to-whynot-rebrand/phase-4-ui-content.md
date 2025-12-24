# Phase 4: UI Text & User-Facing Content

## Objective
Update all user-facing text, page titles, and meta tags to use "WhyNot" branding.

## Files to Update

### 1. HTML Entry Point
**File**: `client/index.html` (if exists)
- `<title>` tag
- Meta description
- Open Graph tags

### 2. Navigation Components
**File**: `client/src/components/NavBar/NavBar.tsx`
**Changes**:
- Logo text
- App name in navigation
- Any branding elements

### 3. Page Titles & Meta
Check all page components for:
- Page titles
- Document title updates
- Breadcrumbs
- Headers

**Potential files**:
- `client/src/pages/LandingPage.tsx`
- `client/src/pages/LoginPage.tsx`
- `client/src/pages/RegisterPage.tsx`
- `client/src/pages/DashboardPage.tsx`
- Any other page components

### 4. Error Messages
**Search for user-facing errors**:
```bash
grep -r "NotWhat\|notwhat" client/src/components client/src/pages
```

Update any error messages that mention the app name

### 5. Authentication Pages
**Files**:
- Login page header/title
- Registration page header/title
- Password reset (if exists)

### 6. Footer (if exists)
- Copyright notice
- Branding text
- Links

## Component-Specific Changes

### NavBar/Header
```tsx
// Before
<h1>NotWhat</h1>

// After
<h1>WhyNot</h1>
```

### Landing Page
```tsx
// Before
<h1>Welcome to NotWhat</h1>
<p>NotWhat is a live streaming platform...</p>

// After
<h1>Welcome to WhyNot</h1>
<p>WhyNot is a live streaming platform...</p>
```

### Document Titles
```tsx
// Before
useEffect(() => {
  document.title = 'NotWhat - Dashboard';
}, []);

// After
useEffect(() => {
  document.title = 'WhyNot - Dashboard';
}, []);
```

## Search & Replace Patterns

1. **In JSX/TSX files**:
   - `NotWhat` → `WhyNot`
   - `notwhat` → `whynot`

2. **In meta tags**:
   - Update descriptions
   - Update Open Graph titles

3. **In comments**:
   - Update any TODO comments
   - Update component documentation

## Steps

1. **Find all user-facing text**
   ```bash
   grep -r "NotWhat\|notwhat" client/src/ --include="*.tsx" --include="*.ts"
   ```

2. **Update NavBar component**
   - Open `client/src/components/NavBar/NavBar.tsx`
   - Replace branding text

3. **Update page titles**
   - Check each page component
   - Update `document.title` calls
   - Update headers and headings

4. **Update authentication pages**
   - Login/Register headers
   - Welcome messages

5. **Update error messages**
   - Search for user-facing errors
   - Replace app name references

6. **Update HTML meta tags** (if file exists)
   - `client/index.html`
   - Title, description, OG tags

7. **Test UI rendering**
   - Run dev server
   - Check all pages visually
   - Verify branding consistency

## Validation

- [ ] NavBar displays "WhyNot"
- [ ] Page titles are correct
- [ ] Landing page shows new branding
- [ ] Login/Register pages updated
- [ ] No "NotWhat" visible in UI
- [ ] Browser tab title correct
- [ ] Meta tags updated

## Acceptance Criteria

- ✅ All visible UI text uses "WhyNot"
- ✅ Document titles updated
- ✅ Meta tags reflect new branding
- ✅ No "NotWhat" visible to users
- ✅ Branding is consistent across all pages

## Testing Checklist

Visit each page and verify branding:
- [ ] Landing page
- [ ] Login page
- [ ] Registration page
- [ ] Dashboard
- [ ] Channels list
- [ ] Channel detail
- [ ] Shops list
- [ ] Shop detail
- [ ] Products pages
- [ ] Error pages

## Estimated Time
**1 hour**

## Status
⏳ **PENDING** (Can start after Phase 3)

## Notes
- Focus on user-visible text only
- Don't change variable names or function names
- Test in browser after changes
- Check both light/dark modes if applicable

# Phase 3: Rename Shop Pages

## Objective

Rename all Shop-related pages to follow the `<Entity><Action>Page` naming convention.

## Files to Update

### Files to Rename:
- `client/src/pages/ShopsPage.tsx` → `ShopListPage.tsx`
- `client/src/pages/ShopDetailPage.tsx` → `ShopDetailsPage.tsx`
- `client/src/pages/CreateShopPage.tsx` → `ShopCreatePage.tsx`

### Files to Modify:
- `client/src/App.tsx` (update imports and route components)
- `client/src/pages/ShopLayout.tsx` (check for imports, if any)

## Steps

1. **Navigate to pages directory**
   ```bash
   cd client/src/pages
   ```

2. **Rename files using git mv**
   ```bash
   git mv ShopsPage.tsx ShopListPage.tsx
   git mv ShopDetailPage.tsx ShopDetailsPage.tsx
   git mv CreateShopPage.tsx ShopCreatePage.tsx
   ```

3. **Update component export names**
   - In `ShopListPage.tsx`: Change `export default function ShopsPage()` to `export default function ShopListPage()`
   - In `ShopDetailsPage.tsx`: Change `export default function ShopDetailPage()` to `export default function ShopDetailsPage()`
   - In `ShopCreatePage.tsx`: Change `export default function CreateShopPage()` to `export default function ShopCreatePage()`

4. **Update imports in App.tsx**
   ```typescript
   // Old imports
   import ShopsPage from "./pages/ShopsPage";
   import ShopDetailPage from "./pages/ShopDetailPage";
   import CreateShopPage from "./pages/CreateShopPage";
   
   // New imports
   import ShopListPage from "./pages/ShopListPage";
   import ShopDetailsPage from "./pages/ShopDetailsPage";
   import ShopCreatePage from "./pages/ShopCreatePage";
   ```

5. **Update route components in App.tsx**
   ```typescript
   <Route path="/shops" element={<ShopListPage />} />
   <Route path="/shop/create" element={<ProtectedRoute requireRole="SELLER"><ShopCreatePage /></ProtectedRoute>} />
   ```

6. **Check ShopLayout.tsx for imports**
   - Open `client/src/pages/ShopLayout.tsx`
   - Check if it imports any of the renamed pages
   - Update imports if necessary

7. **Search for any other references**
   ```bash
   grep -r "ShopsPage\|ShopDetailPage\|CreateShopPage" client/src --include="*.tsx" --include="*.ts"
   ```

8. **Test the changes**
   - Build: `npm run build`
   - Manually test routes:
     - `/shops`
     - `/shop/:id`
     - `/shop/create`

## Design Considerations

- `ShopDetailPage` → `ShopDetailsPage` (add 's' for consistency with `ChannelDetailsPage`)
- ShopLayout might use nested routes, verify route structure remains intact

## Acceptance Criteria

- [x] All 3 shop pages renamed using `git mv`
- [x] Component export names updated in each file
- [x] All imports in App.tsx updated
- [x] ShopLayout.tsx checked and updated if needed
- [x] No other references to old names in codebase
- [x] `npm run build` succeeds without errors
- [ ] Route `/shops` loads correctly
- [ ] Route `/shop/:id` loads correctly
- [ ] Route `/shop/create` loads correctly
- [ ] Navigation from navbar and shop cards works

## Status

⏳ IN PROGRESS - Files renamed, build successful, ready for manual testing

## Notes

- Depends on Phase 2 completion
- ShopLayout is a layout component, not a page, so it's not renamed

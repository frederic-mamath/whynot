# Phase 4: Rename Product Pages

## Objective

Rename all Product-related pages to follow the `<Entity><Action>Page` naming convention.

## Files to Update

### Files to Rename:
- `client/src/pages/ProductsPage.tsx` → `ProductListPage.tsx`
- `client/src/pages/CreateProductPage.tsx` → `ProductCreatePage.tsx`
- `client/src/pages/EditProductPage.tsx` → `ProductUpdatePage.tsx`

### Files to Modify:
- `client/src/App.tsx` (update imports and route components)
- `client/src/pages/ShopLayout.tsx` (update nested route imports)

## Steps

1. **Navigate to pages directory**
   ```bash
   cd client/src/pages
   ```

2. **Rename files using git mv**
   ```bash
   git mv ProductsPage.tsx ProductListPage.tsx
   git mv CreateProductPage.tsx ProductCreatePage.tsx
   git mv EditProductPage.tsx ProductUpdatePage.tsx
   ```

3. **Update component export names**
   - In `ProductListPage.tsx`: Change `export default function ProductsPage()` to `export default function ProductListPage()`
   - In `ProductCreatePage.tsx`: Change `export default function CreateProductPage()` to `export default function ProductCreatePage()`
   - In `ProductUpdatePage.tsx`: Change `export default function EditProductPage()` to `export default function ProductUpdatePage()`

4. **Update imports in App.tsx**
   ```typescript
   // Old imports
   import ProductsPage from "./pages/ProductsPage";
   import CreateProductPage from "./pages/CreateProductPage";
   import EditProductPage from "./pages/EditProductPage";
   
   // New imports
   import ProductListPage from "./pages/ProductListPage";
   import ProductCreatePage from "./pages/ProductCreatePage";
   import ProductUpdatePage from "./pages/ProductUpdatePage";
   ```

5. **Update route components in App.tsx (if defined there)**
   ```typescript
   // Update component references in routes (might be in ShopLayout)
   <Route path="products" element={<ProductListPage />} />
   <Route path="products/create" element={<ProductCreatePage />} />
   <Route path="products/:productId/edit" element={<ProductUpdatePage />} />
   ```

6. **Update ShopLayout.tsx**
   - Open `client/src/pages/ShopLayout.tsx`
   - Update product page imports
   - Update nested route component references

7. **Search for any other references**
   ```bash
   grep -r "ProductsPage\|CreateProductPage\|EditProductPage" client/src --include="*.tsx" --include="*.ts"
   ```

8. **Test the changes**
   - Build: `npm run build`
   - Manually test routes:
     - `/shops/:id/products`
     - `/shops/:id/products/create`
     - `/shops/:shopId/products/:id/edit`

## Design Considerations

- `EditProductPage` → `ProductUpdatePage` to use standard CRUD terminology (Create/Update)
- Product routes are nested under shop routes via ShopLayout
- Ensure ShopLayout's nested Routes structure remains intact

## Acceptance Criteria

- [ ] All 3 product pages renamed using `git mv`
- [ ] Component export names updated in each file
- [ ] All imports in App.tsx updated
- [ ] ShopLayout.tsx imports and routes updated
- [ ] No other references to old names in codebase
- [ ] `npm run build` succeeds without errors
- [ ] Route `/shops/:id/products` loads correctly
- [ ] Route `/shops/:id/products/create` loads correctly
- [ ] Route `/shops/:shopId/products/:id/edit` loads correctly
- [ ] Navigation from shop detail page works
- [ ] "Edit" buttons on product list work

## Status

📝 PLANNING

## Notes

- Depends on Phase 3 completion
- This is the last set of page renames
- "Edit" → "Update" aligns with CRUD terminology (Create, Read, Update, Delete)

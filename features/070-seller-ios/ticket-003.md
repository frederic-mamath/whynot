# Ticket 003 — Product list + create product

## Goal

Replace the Inventaire stub with a real product list and a create product screen. Sellers can add a product with one photo picked from their camera roll. The image upload reuses the exact pattern from `app/onboarding.tsx` (`expo-image-picker` → base64 → `trpc.image.upload`).

## Acceptance Criteria

- As a seller, when I open Inventaire, I see all my products with their name, wished price, and active/inactive status
- As a seller, when no products exist, I see an empty state with a prompt to add the first product
- As a seller, when I tap the "+" FAB, I am taken to a create product form
- As a seller, on the create form, I can fill in: name (required), wished price (€, optional), starting price (€, optional for auction), description (optional)
- As a seller, I can pick one photo from my camera roll for the product
- As a seller, when I submit the form, the product is created and I am returned to the list which now includes the new product
- As a seller, if name is empty and I tap submit, I see a validation error inline — no server call is made

## Technical Strategy

- Screen — `ios-app/app/seller/products/index.tsx` (replace stub)
  - `shop.getOrCreateMyShop.useQuery()` to get `shopId`
  - `product.list.useQuery({ shopId })` — enabled when shopId known
  - `FlatList` of product rows: image thumbnail (64×64), name, price, active badge
  - Empty state: centered message "Aucun produit — ajoutez votre premier article"
  - FAB (absolute bottom-right): `+` → `router.push("/seller/products/new")`

- Screen — `ios-app/app/seller/products/new.tsx` (create)
  - Local state: `name`, `wishedPrice`, `startingPrice`, `description`, `imageBase64`, `imageUri`
  - Image picker: `ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", base64: true, quality: 0.7 })` — same config as `onboarding.tsx`
  - Submit flow:
    1. Validate `name.trim() !== ""`
    2. `product.create.mutate({ shopId, name, wishedPrice, startingPrice, description })`
    3. If `imageBase64`: `image.upload.mutate({ base64 })` → `product.addImage.mutate({ productId, url })`
    4. `utils.product.list.invalidate({ shopId })` → `router.back()`
  - Loading state on submit button while mutations run
  - tRPC: `shop.getOrCreateMyShop`, `product.create`, `image.upload`, `product.addImage`

- Navigation — `ios-app/app/seller/_layout.tsx`
  - Add `products/index` and `products/new` to Stack

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Open Inventaire → empty state shown
2. Tap + → form opens
3. Fill name + pick photo → submit → product appears in list with photo thumbnail
4. Submit with empty name → inline error, no network call

## Manual operations to configure services

None.

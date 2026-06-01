# Ticket 004 — Edit + delete product

## Goal

Add an edit screen reachable from the product list. Sellers can update any field, replace the product photo, toggle the product active/inactive, or delete the product. The form is pre-filled with current values.

## Acceptance Criteria

- As a seller, when I tap a product in the list, I am taken to an edit screen pre-filled with the product's current name, prices, description, and photo
- As a seller, I can update any field and tap "Enregistrer" to save
- As a seller, I can toggle the product between active and inactive with a switch — change takes effect immediately with optimistic UI
- As a seller, I can pick a new photo to replace the existing one
- As a seller, when I tap "Supprimer" and confirm the alert, the product is deleted and I am returned to the list
- As a seller, if I delete the product, it disappears from the list immediately (optimistic removal)

## Technical Strategy

- Screen — `ios-app/app/seller/products/[id].tsx` (create)
  - `product.get.useQuery({ productId })` to pre-fill fields
  - Same form fields as `new.tsx`: name, wishedPrice, startingPrice, description
  - Photo section: shows existing `image_url`; tap to replace via `ImagePicker`
  - Active toggle: `Switch` component → `product.update.useMutation({ isActive })` with optimistic update on `utils.product.list`
  - Save: `product.update.mutate({ productId, name, wishedPrice, startingPrice, description })` → if new image: `image.upload` + `product.addImage`
  - Delete: `Alert.alert("Supprimer", "Cette action est irréversible", [...])` → `product.delete.mutate({ productId })` → optimistic filter on `utils.product.list` cache → `router.back()`

- Product list row — `ios-app/app/seller/products/index.tsx` (modify)
  - Make each row a `Pressable` → `router.push("/seller/products/" + item.id)`

- Navigation — `ios-app/app/seller/_layout.tsx`
  - Add `products/[id]` to Stack

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Tap product → edit screen opens with pre-filled values
2. Change name → save → list reflects new name immediately
3. Toggle active switch → changes instantly, no reload
4. Tap Supprimer → confirm → product gone from list
5. Pick new photo → save → thumbnail updated in list

## Manual operations to configure services

None.

# Phase 8: Seller — Shop & Product Management

## Objective

Implement seller screens for managing shops and products, including product creation with camera photo capture via `expo-image-picker` and Cloudinary upload.

## User-Facing Changes

- Shop list and creation screens
- Shop detail with product list
- Product create/edit with multi-image upload (camera + gallery)
- Pending deliveries management

## Files to Update

### Frontend (mobile-app/)

- `app/(tabs)/shop/index.tsx` — Shop list (seller's shops)
- `app/(tabs)/shop/create.tsx` — Create shop form
- `app/shop/[id]/index.tsx` — Shop detail + product list
- `app/shop/[id]/products/create.tsx` — Create product with images
- `app/shop/[id]/products/[productId]/edit.tsx` — Edit product
- `app/(tabs)/shop/deliveries.tsx` — Pending deliveries list
- `src/components/ImageUploader.tsx` — RN image uploader (camera + gallery)
- `src/components/ProductCard.tsx` — Product card component
- `src/components/ShopCard.tsx` — Shop card component

## Steps

1. Install `expo-image-picker` for camera/gallery access
2. Create ShopCard and ProductCard components
3. Build shop list screen with `shop.listMyShops` query
4. Build shop creation screen with `shop.create` mutation
5. Build shop detail screen with product list
6. Create RN ImageUploader using `expo-image-picker` (launchCameraAsync + launchImageLibraryAsync → base64 → `image.upload`)
7. Build product create screen with ImageUploader integration
8. Build product edit screen with existing image loading
9. Build pending deliveries screen

## Acceptance Criteria

- [x] Sellers can view, create shops
- [x] Products CRUD works with images
- [x] Camera captures photo and uploads to Cloudinary
- [x] Gallery selection uploads to Cloudinary
- [x] Multi-image support (up to 5 per product)
- [x] Pending deliveries list with mark-as-shipped action

## Status

✅ DONE

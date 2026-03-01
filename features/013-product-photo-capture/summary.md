# Product Photo Capture & Multi-Image Upload - Summary

## Overview

Allow sellers to take a photo with their phone camera (or choose from gallery) directly from the product creation/edit form, upload it to Cloudinary, and support multiple images per product.

## User Story

As a **seller**, I want to take a photo with my phone or choose from my gallery when creating/editing a product, so that I can quickly attach product images without needing to host them elsewhere.

## Business Goal

- Eliminate the friction of manually hosting images and pasting URLs
- Enable mobile-first product creation with camera capture
- Support multiple product images for richer product listings
- Store images reliably on Cloudinary CDN for fast global delivery

## Progress Tracking

| Phase   | Description                          | Status  |
| ------- | ------------------------------------ | ------- |
| Phase 1 | Cloudinary backend infra             | ✅ DONE |
| Phase 2 | product_images DB table              | ✅ DONE |
| Phase 3 | ImageUploader frontend component     | ✅ DONE |
| Phase 4 | ProductCreate/UpdatePage integration | ✅ DONE |

## Files Created

### Backend

- `app/src/services/CloudinaryService.ts` — Cloudinary SDK wrapper with `uploadImage(base64)` and `deleteImage(publicId)` methods. Auto-resizes to max 1200×1200, auto quality/format.
- `app/src/routers/image.ts` — tRPC router with `image.upload` protected mutation (accepts base64, returns Cloudinary URL + publicId)
- `app/src/repositories/ProductImageRepository.ts` — CRUD repository for `product_images` table (findByProductId, save, deleteById, getNextPosition, etc.)
- `app/migrations/020_create_product_images.ts` — Migration creating `product_images` table (id, product_id FK cascade, url, cloudinary_public_id, position, created_at)

### Frontend

- `app/client/src/components/ui/ImageUploader/ImageUploader.tsx` — Reusable multi-image uploader with two tabs: "Photo" (file input with `accept="image/*"` — opens camera on mobile) and "URL" (paste a link). Previews with remove buttons, "Main" badge on first image, upload progress spinner.
- `app/client/src/components/ui/ImageUploader/index.ts` — Barrel export

## Files Modified

### Backend

- `app/src/db/types.ts` — Added `product_images` to Database interface + `ProductImagesTable` + `ProductImage` type
- `app/src/routers/index.ts` — Registered `image: imageRouter` in the app router
- `app/src/routers/product.ts` — Added 3 procedures: `addImage`, `removeImage`, `listImages`. `addImage` also syncs `products.image_url` with the first image for backward compatibility.
- `app/src/repositories/index.ts` — Exported `productImageRepository`
- `app/src/index.ts` — Increased `express.json()` limit from 100KB to 10MB for base64 image payloads
- `app/.env.example` — Added `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Frontend

- `app/client/src/pages/ProductCreatePage.tsx` — Replaced single URL input with `ImageUploader` component. Submit now creates product first, then saves all images to `product_images` via `addImage` mutation.
- `app/client/src/pages/ProductUpdatePage.tsx` — Replaced URL input with `ImageUploader`. Loads existing images from `product_images` (with fallback to legacy `imageUrl`). Submit diffs images to add new / remove deleted ones.

## Architecture Decisions

- **Signed upload via backend**: Cloudinary API keys stay server-side (in `CloudinaryService`), more secure than unsigned client-side presets
- **Base64 via tRPC**: Consistent with existing architecture (no separate Express routes). Required `express.json({ limit: '10mb' })` increase.
- **`product_images` table**: Supports multiple images with ordering (`position` column). FK cascade ensures cleanup on product deletion.
- **Backward compatibility**: `products.image_url` is still synced automatically (set to first image on add, cleared on remove). All existing display components (ProductCard, PromotedProducts, HighlightedProduct, ChatPanel, AuctionWidget, OrderCard) continue working unchanged.
- **Tab UI (Photo/URL)**: Both input methods coexist. Photo tab uses `<input type="file" accept="image/*">` which natively opens camera or gallery on mobile.

## Setup Required

Add these environment variables to `.env` (or Render dashboard):

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run migration: `npx tsx migrate.ts`

## Status

✅ COMPLETE

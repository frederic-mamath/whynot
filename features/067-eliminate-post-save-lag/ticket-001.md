# Ticket 001 — Web app: setData() on all non-live mutation sites

## Goal

Replace `invalidate()`-only `onSuccess` handlers with `setData()` + background `invalidate()` across all web pages where mutated data is immediately visible and derivable from the input. Live page excluded — see `app/client/CLAUDE.md`.

## Acceptance Criteria

- As a buyer/seller, when I save my first or last name on the profile page, the display updates instantly — no visible lag before the refetch
- As a buyer/seller, when I upload a new avatar, the avatar in the profile card updates instantly
- As a buyer/seller, when I add, edit, or delete an address, the address list updates instantly
- As a buyer/seller, when I delete a payment method, the card disappears instantly
- As a seller, when I update my shop name or description, the display updates instantly
- As a seller, when I delete a product from the shop page, the product disappears instantly
- As a seller, when I schedule or delete a live, the lives list updates instantly
- As a buyer/seller, when I follow or unfollow a seller (from the sellers page or home page), the button state updates instantly
- The live page (`LiveDetailsPage`) is untouched — no `setData()` added there

## Technical Strategy

- Frontend (`app/client/src/`)
  - The pattern for every site below is identical:
    ```ts
    onSuccess: (data, input) => {
      utils.X.Y.setData(args, (old) => old ? { ...old, ...patch } : old);
      utils.X.Y.invalidate(args);
    }
    ```
  - Hook *(modify)* — `pages/ProfilePage.hooks.ts`
    - `updateProfile` → `setData` on `utils.profile.me`: patch `firstName`, `lastName` from `input`
    - `updateAvatarMutation` → `setData` on `utils.profile.me`: patch `avatarUrl`, `avatarPublicId` from mutation `data` (response contains the new URL)
    - `createAddress` → `setData` on `utils.profile.me`: append new address to `profile.addresses` using mutation `data` response
    - `updateAddress` → `setData` on `utils.profile.me`: replace address with matching `id` using `input`
    - `deleteAddress` → `setData` on `utils.profile.me`: filter out address with `input.id`
    - `deletePaymentMethod` → `setData` on `utils.payment.getPaymentStatus`: filter out method with `input.paymentMethodId`
    - `saveRelayPoint` → `setData` on `utils.profile.me`: append relay point address using mutation `data` response
    - `setDefaultAddress` → `setData` on `utils.profile.me`: mark `input.id` as `isDefault: true`, all others `isDefault: false`
  - Page *(modify)* — `pages/ShopDetailsPage.tsx`
    - `updateShopMutation` → `setData` on `utils.shop.get`: patch `name`, `description` from `input`
  - Component *(modify)* — `components/ShopProductItem/ShopProductItem.tsx`
    - `deleteProductMutation` → `setData` on `utils.product.list`: filter out product with matching `id`
  - Page *(modify)* — `pages/SellerLivesPage/ScheduleLiveDialog.tsx`
    - `scheduleLive` → `setData` on `utils.live.listByHost`: append new live from mutation `data` response
  - Hook *(modify)* — `pages/SellerLivesPage/SellerLivesPage.hooks.ts`
    - `deleteLive` → `setData` on `utils.live.listByHost`: filter out live with `input.id`
  - Hook *(modify)* — `pages/SellersPage.hooks.ts`
    - `followSeller` → `setData` on `utils.shop.listAllSellers`: set `isFollowed: true` for `input.shopId`
    - `unfollowSeller` → `setData` on `utils.shop.listAllSellers`: set `isFollowed: false` for `input.shopId`
  - Hook *(modify)* — `pages/HomePage.hooks.ts`
    - `followSeller` → `setData` on `utils.shop.listSellers`: set `isFollowed: true` for `input.shopId`
    - `unfollowSeller` → `setData` on `utils.shop.listSellers`: set `isFollowed: false` for `input.shopId`

## Note on setData shape

Before writing each `setData` call, read the tRPC router's return type for that query (in `app/src/routers/`) to confirm the exact shape of the cached object. Never guess — the `old` argument in `setData` is typed; TypeScript will catch mismatches at build time.

## Verification

```bash
cd app && npm run build:client   # zero TypeScript errors
```

Manual checklist:
1. Profile page → save name → display updates before any network spinner
2. Profile page → delete payment method → card disappears instantly
3. Sellers page → follow → button state flips instantly
4. SellerLives page → delete a live → row disappears instantly

## Manual operations to configure services

None.

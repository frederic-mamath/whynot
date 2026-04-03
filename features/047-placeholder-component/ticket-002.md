# Ticket 002 — Migrate MyOrdersPage, ShopListPage, ChannelListPage, ProductListPage

## Acceptance Criteria

- As a user, on each of the four pages below, the empty state renders using the `Placeholder` component with a consistent layout.
- The app builds with zero errors after the migration.

---

## Technical Strategy

- **Frontend**
  - Migration
    - `app/client/src/pages/MyOrdersPage.tsx`
      - Replace the `EmptyState` local component entirely with `Placeholder`.
      - Primary call site (filter `"all"`): `<Placeholder Icon={<ShoppingBag className="size-8" />} title={t("orders.noOrders")} ButtonListProps={[{ icon: <Package className="size-4" />, label: t("orders.browseChannels"), onClick: () => window.location.assign("/lives"), className: "bg-primary text-primary-foreground" }]} />`
      - Other filter call sites: `<Placeholder Icon={<ShoppingBag className="size-8" />} title={getMessage()} ButtonListProps={[{ label: t("orders.viewAllOrders"), onClick: () => window.location.reload(), className: "border border-border bg-background text-foreground" }]} />`
      - Remove the now-unused `EmptyState` function.

    - `app/client/src/pages/ShopListPage.tsx`
      - Replace the hand-rolled `<div className="text-center py-12">` block with:
        `<Placeholder Icon={<Store className="size-12" />} title={t("shops.list.noShops")} ButtonListProps={[{ icon: <Plus className="size-4" />, label: t("shops.list.createShop"), onClick: () => navigate("/shops/create"), className: "bg-primary text-primary-foreground" }]} />`

    - `app/client/src/pages/ChannelListPage.tsx`
      - Replace the `channels?.length === 0` block with `Placeholder`.
      - When `canCreateChannel` is true: include a button entry `{ icon: <Plus className="size-4" />, label: t("channels.list.createChannel"), onClick: () => navigate("/create-channel"), className: "bg-primary text-primary-foreground" }`.
      - When `canCreateChannel` is false: pass no `ButtonListProps` (the explanatory text about seller/shop requirement is dropped — it duplicates context already visible on the page).

    - `app/client/src/pages/ProductListPage.tsx`
      - Replace the `<div className="text-center py-16">` block with:
        `<Placeholder Icon={<Package className="size-20" />} title={t("products.list.noProducts")} ButtonListProps={[{ icon: <Plus className="size-4" />, label: t("products.list.createProduct"), onClick: () => navigate(`/shops/${shopIdNum}/products/create`), className: "bg-primary text-primary-foreground" }]} />`

---

## Manual operations to configure services

None.

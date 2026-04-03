# Ticket 003 — Migrate ProductListSection, SellerLivesPage, SellerDeliveriesPage

## Acceptance Criteria

- As a user, on each of the three pages/components below, all empty states render using the `Placeholder` component with a consistent layout.
- The app builds with zero errors after the migration.

---

## Technical Strategy

- **Frontend**
  - Migration
    - `app/client/src/components/ProductListSection/ProductListSection.tsx`
      - **No-shop empty state**: replace the `<div className="flex flex-col items-center gap-2 py-4 ...">` block with:
        `<Placeholder Icon={<ShoppingBag className="size-7" />} title="Crée ta boutique avant d'associer des produits." ButtonListProps={[{ label: "Créer ma boutique", className: "text-xs", onClick: onNavigateToShop }]} />`
      - **No-products empty state**: same pattern:
        `<Placeholder Icon={<ShoppingBag className="size-7" />} title="Ajoute des produits à ta boutique pour les lier à ce live." ButtonListProps={[{ label: "Créer un produit", className: "text-xs", onClick: onNavigateToCreateProduct }]} />`

    - `app/client/src/pages/SellerLivesPage/SellerLivesPage.tsx`
      - **Upcoming lives empty state**: replace the `<div className="flex flex-col items-center justify-center py-8 gap-2 ...">` block with:
        `<Placeholder Icon={<Calendar className="size-8" />} title="Aucun live programmé" />`
      - **Past lives empty state**:
        `<Placeholder Icon={<Radio className="size-8" />} title="Aucun live passé" />`

    - `app/client/src/pages/SellerDeliveriesPage/SellerDeliveriesPage.tsx`
      - Remove the local `EmptyState` component entirely.
      - **Pending orders empty state**:
        `<Placeholder Icon={<Package className="size-8" />} title="Aucune commande en attente d'expédition" />`
      - **Shipped orders empty state**:
        `<Placeholder Icon={<Truck className="size-8" />} title="Aucun colis expédié" />`

---

## Manual operations to configure services

None.

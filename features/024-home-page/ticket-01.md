# Ticket 01 — Backend : `shop.listSellers`

## Acceptance Criteria

- En tant que développeur, `trpc.shop.listSellers` (protectedProcedure) retourne un tableau de vendeurs.
- Chaque entrée contient : `userId`, `nickname`, `avatarUrl`, `shopId`, `shopName`, `topCategories: { name, emoji }[]` (max 3, triées par fréquence de produits actifs DESC).
- Les SELLER sans boutique sont exclus.
- Les produits inactifs et sans catégorie sont exclus du calcul.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/shop.ts`
      - Import `db` depuis `../db` et `sql` depuis `kysely`.
      - `listSellers` _(nouvelle procedure)_ : `protectedProcedure`. Query `shops INNER JOIN users ON users.id = shops.owner_id`. Pour chaque shop (via `Promise.all`) : query `products INNER JOIN categories ON categories.id = products.category_id` WHERE `shop_id = shop.shopId` AND `is_active = true` AND `category_id IS NOT NULL`, GROUP BY `categories.id`, ORDER BY `COUNT(*) DESC` LIMIT 3. Retourne le tableau enrichi.

## Manual operations

Aucune.

## Status

completed

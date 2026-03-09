# 020 - Seller Shop Page

Redesign the seller experience with a dedicated shop page featuring a bottom navigation bar, product management with new fields (category, condition, starting price, wished price), and a 1-shop-per-seller model.

## Key Decisions

- **1 shop per seller**: unique constraint on `shops.owner_id`, migration merges existing duplicates
- **Bottom nav**: replaces NavBar for sellers — 5 tabs: Home, Lives, GO (placeholder), Explorer, Boutique
- **New product fields**: `starting_price`, `wished_price`, `category_id`, `condition_id`
- **Categories & Conditions**: separate DB tables with seed data, extensible
- **Stats section**: not implemented (out of scope)
- **GO button**: placeholder only

| Ticket | Description                                                              | Status    |
| :----- | :----------------------------------------------------------------------- | :-------- |
| 01     | DB migrations (unique owner, categories, conditions, product fields)     | completed |
| 02     | Backend repos + router updates (catalog, shop.getMyShop, product fields) | completed |
| 03     | BottomNav + SellerLayout + placeholder pages + /seller routes            | completed |
| 04     | ShopPage Boutique tab (product list, header)                             | completed |
| 05     | ShopPage + Produit tab (product creation form)                           | completed |

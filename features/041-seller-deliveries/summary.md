# Feature 041 — Seller Delivery System with Mondial Relay

## Initial Prompt

> As a seller, in the SellerDeliveriesPage (previously /pending-deliveries), I want to see the new card to display the package waiting for delivery.
>
> Each package will contains all the products that buyer A bought from seller A for a live A.
>
> I want the delivery system to go through Mondial Relay API.

## Design Decisions

- **Delivery carrier**: Mondial Relay Point Relais only. Home delivery is architecturally kept as a stub ("bientôt disponible").
- **Package grouping**: buyer + seller + live = one package. All products a buyer purchased from a seller during a specific live are bundled into one shipment.
- **Package weight**: seller inputs the total weight in grams at label generation time (modal prompt).
- **Route**: page moves from `/pending-deliveries` to `/seller/livraisons` under the seller hub.
- **Payout**: per-package (one "Demander le paiement" button covers all orders in the package).
- **Relay point picker**: buyers search by postcode in their ProfilePage to select and save a Point Relais.

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a seller, at /seller/livraisons, I should see packages grouped by buyer + live, not individual orders | planned |
| As a seller, each package card shows the live cover, buyer name, product list, and a date timeline | planned |
| As a seller, I can click "Générer le label" to create a Mondial Relay shipping label (PDF opens in new tab) | planned |
| As a seller, when the buyer hasn't selected a relay point, the label button is disabled with an explanation | planned |
| As a seller, I can click "Rafraîchir l'état" to poll Mondial Relay for the latest tracking status | planned |
| As a seller, once the package is shipped, I see a "Demander le paiement" button for all orders in the package | planned |
| As a buyer, in my ProfilePage, I can search for a Point Relais by postcode and save it as my delivery address | planned |
| As a system, when a buyer pays for an order, a package is auto-created grouping all orders for that live | planned |

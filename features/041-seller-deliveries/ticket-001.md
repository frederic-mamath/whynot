# Ticket 001 — Delivery System Foundation (DB + Backend)

## Acceptance Criteria

- As a system, when a buyer's payment succeeds, a package should be automatically created grouping all orders for that buyer × seller × live
- As a system, the packages table enforces one package per (buyer, seller, live) triplet
- As a seller, calling `trpc.package.getPackagesForSeller` returns packages split into pending and shipped, each with buyer name, live info, product list, and tracking info
- As a seller, calling `trpc.package.generateLabel` with a packageId and weight creates a Mondial Relay label and returns the tracking number + PDF label URL
- As a seller, calling `trpc.package.refreshStatus` updates the package status from Mondial Relay tracking
- As a seller, calling `trpc.package.requestPayouts` creates payout requests for all paid orders in a shipped package
- As a buyer, calling `trpc.profile.addresses.searchRelayPoints` returns relay points near a postcode
- As a buyer, calling `trpc.profile.addresses.saveRelayPoint` saves a relay point as their delivery address

## Technical Strategy

- Database
  - Migration (`app/migrations/038_create_packages.ts`)
    - Create `packages` table: id (UUID PK), buyer_id, seller_id, live_id (unique triplet), tracking_number, label_url, weight_grams, mondial_relay_point_id, status (varchar: pending/label_generated/shipped/delivered/incident), delivered_at, created_at, updated_at
    - Unique index on `(buyer_id, seller_id, live_id)`
  - Migration (`app/migrations/039_add_package_id_to_orders.ts`)
    - Add nullable `package_id uuid` FK to `orders` table (ON DELETE SET NULL)
  - Migration (`app/migrations/040_add_mondial_relay_point_id_to_user_addresses.ts`)
    - Add nullable `mondial_relay_point_id varchar(50)` to `user_addresses`
  - Types (`app/src/db/types.ts`)
    - Add `PackagesTable` interface
    - Add `package_id: string | null` to `OrdersTable`
    - Add `mondial_relay_point_id: string | null` to `UserAddressesTable`
    - Register `packages: PackagesTable` in `Database`

- Backend
  - Service (`app/src/services/MondialRelayService.ts`)
    - `searchRelayPoints(postcode, country)` → `GET /points-relais?PostalCode=...&CountryCode=...`
    - `createLabel(params)` → `POST /shipments`, returns `{ trackingNumber, labelUrl }` where labelUrl is a base64 PDF data URI
    - `getTracking(trackingNumber)` → `GET /shipments/{trackingNumber}/tracking`, maps event codes to internal status
    - Auth: HTTP Basic Auth with `MONDIAL_RELAY_CUSTOMER_ID` + `MONDIAL_RELAY_API_KEY` env vars
    - Staging URL when `NODE_ENV !== "production"`
  - Repository (`app/src/repositories/PackageRepository.ts`)
    - `findBySellerId(sellerId)`: two-query strategy (packages + orders), GROUP orders by package_id in JS
    - `findOrCreate(buyerId, sellerId, liveId)`: INSERT ON CONFLICT DO NOTHING + fallback SELECT
    - `assignOrderToPackage(orderId, packageId)`: UPDATE orders SET package_id
    - `updateLabel(id, trackingNumber, labelUrl, weightGrams, relayPointId)`: SET fields + status = 'label_generated'
    - `updateStatus(id, status, deliveredAt?)`: SET status + optional delivered_at
    - `findByIdForSeller(id, sellerId)`: SELECT WHERE id + seller_id
  - Router (`app/src/routers/package.ts`)
    - `getPackagesForSeller` (protectedProcedure query): calls `findBySellerId`, splits into pending/shipped, serializes dates
    - `generateLabel` (protectedProcedure mutation, input: `{ packageId: uuid, weightGrams: int }`): fetches seller onboarding address, buyer relay address, calls `mondialRelayService.createLabel`, calls `packageRepository.updateLabel`, marks orders as shipped
    - `refreshStatus` (protectedProcedure mutation, input: `{ packageId: uuid }`): calls `mondialRelayService.getTracking`, calls `packageRepository.updateStatus`
    - `requestPayouts` (protectedProcedure mutation, input: `{ packageId: uuid }`): INSERT payout_requests for qualifying orders
  - Router (`app/src/routers/profile.ts`)
    - Add `addresses.searchRelayPoints` (query, input: `{ postcode, country? }`) → calls `mondialRelayService.searchRelayPoints`
    - Add `addresses.saveRelayPoint` (mutation): DELETE old relay point address, UPDATE is_default = false for others, INSERT new relay point address
    - Expose `mondialRelayPointId` in `me` query's address mapping
  - Router registry (`app/src/routers/index.ts`)
    - Register `package: packageRouter`
  - Webhook (`app/src/index.ts`)
    - In `payment_intent.succeeded`: after marking order as paid, call `packageRepository.findOrCreate(buyerId, sellerId, liveChannelId)` + `packageRepository.assignOrderToPackage(orderId, packageId)`
  - Env (`app/.env.example`)
    - Add `MONDIAL_RELAY_CUSTOMER_ID` and `MONDIAL_RELAY_API_KEY`

## Manual operations to configure services

- Mondial Relay (https://connect.mondialrelay.com)
  - Log into the Connect merchant portal to retrieve your `CustomerId` (merchant code) and `APIKey`
  - For testing, use staging URL `https://connect-staging.mondialrelay.com/api/v5` with test credentials (`BDTEST13`)
  - For production, set `NODE_ENV=production` and provide real credentials
  - Ensure your Mondial Relay contract covers **Point Relais (Mode 24R)** shipments for France

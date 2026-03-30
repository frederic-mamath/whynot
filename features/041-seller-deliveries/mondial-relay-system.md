# Mondial Relay Integration — System Design

## Overview

Mondial Relay is a French parcel carrier offering two delivery modes:
- **Point Relais (24R/48R)**: buyer picks up at a relay point near them. Cheaper, very popular in France.
- **Livraison Domicile (LD1)**: home delivery. *Not implemented yet — "bientôt disponible".*

We use the **Connect REST API v5**.

---

## API Reference

### Authentication

HTTP Basic Auth on every request:
```
Authorization: Basic base64("{MONDIAL_RELAY_CUSTOMER_ID}:{MONDIAL_RELAY_API_KEY}")
```

### Base URLs

| Environment | URL |
|-------------|-----|
| Production  | `https://connect.mondialrelay.com/api/v5` |
| Staging     | `https://connect-staging.mondialrelay.com/api/v5` |

Use staging when `NODE_ENV !== "production"`. Staging uses merchant code `BDTEST13` with its test API key.

### ENV variables

```
MONDIAL_RELAY_CUSTOMER_ID=BDTEST13        # merchant code
MONDIAL_RELAY_API_KEY=your_api_key_here
```

---

## Endpoint 1 — Search Relay Points

```
GET /points-relais?PostalCode={postcode}&CountryCode=FR
```

**Response:**
```json
{
  "PointsRelaisList": [
    {
      "ID": "PRX001",
      "Localisation1": "Tabac du Centre",
      "LgAdr1": "12 Rue de la Paix",
      "LgAdr2": "",
      "CP": "75001",
      "Ville": "Paris",
      "Pays": "FR",
      "Latitude": "48.869",
      "Longitude": "2.331"
    }
  ]
}
```

**Used by:** buyer's ProfilePage relay point picker. The `ID` field is stored in `user_addresses.mondial_relay_point_id`.

---

## Endpoint 2 — Create Shipment (Generate Label)

```
POST /shipments
Content-Type: application/json
```

**Request body:**
```json
{
  "CustomerId": "BDTEST13",
  "OutputFormat": "PDF",
  "OutputType": "Label",
  "Shipment": {
    "OrderNo": "WN-{packageId[0:8]}",
    "CustomerNo": "BDTEST13",
    "ShipmentsList": [{
      "ParcelCount": 1,
      "Content": "Commande WhyNot",
      "Weight": { "Value": 500, "Unit": "gr" },
      "DeliveryMode": {
        "Mode": "24R",
        "Location": "{relayPointId}"
      },
      "Sender": {
        "Address": {
          "Lastname": "{sellerName}",
          "Streetname": "{sellerStreet}",
          "PostCode": "{sellerZip}",
          "City": "{sellerCity}",
          "CountryCode": "FR"
        }
      },
      "Recipient": {
        "Address": {
          "Firstname": "{buyerFirstname}",
          "Lastname": "{buyerLastname}",
          "Streetname": "{relayStreetName}",
          "PostCode": "{relayZip}",
          "City": "{relayCity}",
          "CountryCode": "FR"
        }
      }
    }]
  }
}
```

**Sender address source**: `seller_onboarding_data.return_*` fields (filled during the 10-step onboarding).

**Recipient + relay address source**:
- Buyer name from `users.firstname / lastname`
- Relay point ID + address from `user_addresses WHERE mondial_relay_point_id IS NOT NULL AND user_id = buyer_id`

**Success response:**
```json
{
  "Shipment": {
    "ShipmentsList": [{
      "Parcel": {
        "TrackingCode": "XXXXXXXXXXXX",
        "Label": {
          "Output": "JVBERi0xLjQK..."
        }
      }
    }]
  }
}
```

`TrackingCode` → stored in `packages.tracking_number`
`Label.Output` → base64 PDF, stored as `"data:application/pdf;base64,{Output}"` in `packages.label_url`. Frontend calls `window.open(labelUrl, "_blank")` to open the PDF in a new tab.

---

## Endpoint 3 — Get Tracking Status

```
GET /shipments/{trackingNumber}/tracking
```

**Response:**
```json
{
  "TrackingList": [
    {
      "Code": "80",
      "Label": "Colis remis au destinataire",
      "Date": "2026-03-28T14:30:00"
    }
  ]
}
```

**Event code mapping to internal status:**

| Mondial Relay Code | Internal Status |
|--------------------|-----------------|
| `80`, `81`         | `delivered`     |
| `97`, `24`         | `incident`      |
| *(any other)*      | `shipped`       |

---

## Package Lifecycle

```
Order paid (Stripe webhook)
    │
    ▼
Package auto-created or found for (buyer, seller, live)
    │
    ▼ [status: "pending"]
Seller views /seller/livraisons
    │
    ▼
Seller clicks "Générer le label" → enters weight in grams
    │
    ▼ POST /shipments
Label PDF returned + TrackingCode stored
    │
    ▼ [status: "label_generated"]
Seller prints label, ships package
    │
    ▼
Seller clicks "Rafraîchir l'état" → GET /shipments/{tracking}/tracking
    │
    ├─► [status: "shipped"] ─► keep refreshing
    │
    ├─► [status: "delivered"] ─► "Demander le paiement" available
    │
    └─► [status: "incident"] ─► badge shown, payout blocked
```

---

## Data Model

### `packages` table (new)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto-generated |
| `buyer_id` | integer FK | references users |
| `seller_id` | integer FK | references users |
| `live_id` | integer FK | references lives |
| `tracking_number` | varchar(50) | filled after label generation |
| `label_url` | text | base64 PDF data URI |
| `weight_grams` | integer | seller-entered |
| `mondial_relay_point_id` | varchar(50) | copied from buyer's relay address |
| `status` | varchar(20) | pending / label_generated / shipped / delivered / incident |
| `delivered_at` | timestamptz | nullable |
| `created_at` | timestamptz | auto |
| `updated_at` | timestamptz | auto |

**Unique index**: `(buyer_id, seller_id, live_id)` — guarantees one package per triplet.

### Changes to existing tables

**`orders` table**: add nullable `package_id uuid` FK to `packages.id` (ON DELETE SET NULL).

**`user_addresses` table**: add nullable `mondial_relay_point_id varchar(50)`. When non-null, the row represents a relay point address.

---

## Buyer Relay Point Flow

1. Buyer goes to ProfilePage → "Point Relais Mondial Relay" section
2. Enters postcode (≥ 4 digits) + clicks "Rechercher"
3. Frontend calls `trpc.profile.addresses.searchRelayPoints({ postcode, country: "FR" })`
4. Backend calls Mondial Relay `GET /points-relais?PostalCode=...` → returns list
5. Buyer selects a relay point → `trpc.profile.addresses.saveRelayPoint(...)` called
6. Backend: deletes old relay point address for user, inserts new one with `mondial_relay_point_id`
7. This relay address is then used at label generation time

**Guard**: When the buyer has no relay point saved, the "Générer le label" button on the seller's package card shows as disabled with tooltip: *"L'acheteur n'a pas encore choisi un point relais"*

---

## Auto-Package Creation (Stripe Webhook)

When a Stripe `payment_intent.succeeded` event fires for an order:

1. Mark order as `payment_status = 'paid'`
2. Fetch order's `buyer_id`, `seller_id`, `auction_id`
3. Fetch `auction.channel_id` → this is the `live_id`
4. Call `PackageRepository.findOrCreate(buyerId, sellerId, liveId)`
   - Uses `INSERT ... ON CONFLICT DO NOTHING` on the unique triplet index
5. Call `PackageRepository.assignOrderToPackage(orderId, packageId)`

This ensures packages are always created atomically with payment, and multiple orders from the same live are automatically grouped.

---

## Home Delivery — Stubbed for Future

When home delivery is implemented:
- `DeliveryMode.Mode` changes from `"24R"` to `"LD1"` (24h home delivery)
- `packages` table needs a `delivery_mode varchar(10)` column
- Recipient address uses buyer's `user_addresses WHERE is_default = true AND mondial_relay_point_id IS NULL`
- ProfilePage address section already supports home addresses (built in feature 039)

The `GenerateLabelDialog` already shows "Livraison domicile — bientôt disponible" as a placeholder.

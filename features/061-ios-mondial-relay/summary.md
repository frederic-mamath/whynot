# iOS Mondial Relay Delivery

## Initial Prompt

As a user on iOS, I would like to be able to choose my address with Mondial Relay. This will be used by buyers to be able to receive their orders.

## Context

- Goal: reduce delivery cost for buyers by offering Mondial Relay pickup points as an alternative to home delivery
- The web app already supports Mondial Relay: `profile.addresses.searchRelayPoints` and `profile.addresses.saveRelayPoint` tRPC routes exist, backed by `app/src/services/MondialRelayService.ts`
- Existing user_addresses table already supports relay points via the `mondial_relay_point_id` column
- iOS currently has **no** address management at all — it must be built from scratch
- Picker style: **list-based** (no map) — chosen to avoid pulling in `react-native-maps`, which would require a new native binary and App Store submission. The list shows distance per point. Map view can be added later via OTA if a UX upgrade is justified.
- Selection scope: **profile-only** — the buyer picks a default delivery method (home address or relay point) in their profile, used for all orders. Per-order selection at checkout is deferred to a later feature.

## Out of Scope

- **Seller-side shipping method distinction** — when a buyer picks a relay point, the seller's flow doesn't yet distinguish home delivery vs relay drop-off. Deferred until the first App Store approval is secured. To be addressed in a future feature.
- Per-order delivery method selection at checkout (future feature)
- Other relay networks (Colissimo Point, Chronopost Shop2Shop, Relais Colis)
- Cash on delivery and signature options
- Shipping cost differences between delivery methods
- Opening hours on relay points (Mondial Relay API response does not include them today)
- Mondial Relay support for non-FR countries (BE/LU/NL) — FR only for MVP

## Tickets

| Ticket     | Description                                                                  | Status  |
| :--------- | :--------------------------------------------------------------------------- | :------ |
| ticket-001 | Add `distanceKm` to `searchRelayPoints` response (backend)                   | done    |
| ticket-002 | iOS Profile — Adresse de livraison section + home address CRUD              | planned |
| ticket-003 | iOS Mondial Relay point picker (list-based, with distance + fallback)        | planned |

## User Stories

| User Story                                                                                                       | Status  |
| :--------------------------------------------------------------------------------------------------------------- | :------ |
| As a buyer on iOS, I can view, add, edit, and delete my home delivery addresses from my profile                  | planned |
| As a buyer on iOS, I can search for Mondial Relay pickup points by postcode and see distance from that postcode | planned |
| As a buyer on iOS, I can select a Mondial Relay point as my default delivery address                            | planned |
| As a buyer on iOS, when the Mondial Relay API is unavailable, I see a clear error and can fall back to home    | planned |

# ticket-001 — Add `distanceKm` to `searchRelayPoints` response

## Acceptance Criteria

- As a developer, when I call `profile.addresses.searchRelayPoints` with `{ postcode: "75001", country: "FR" }`, each item in the response includes a `distanceKm` field (rounded to 1 decimal) representing the distance from the searched postcode's centroid to the relay point
- As a developer, when the postcode cannot be geocoded (unknown or malformed), the route returns the relay points with `distanceKm: null` rather than throwing
- As a developer, `npm run build:client` and `npm run build:server` both pass with zero errors

## Technical Strategy

- Backend (`app/src/`)
  - Service
    - `app/src/services/MondialRelayService.ts`
      - Update `RelayPoint` type to add `distanceKm: number | null`
      - Add private `haversineDistanceKm(lat1, lng1, lat2, lng2)` helper (standard Haversine formula, returns km)
      - Add private `geocodePostcode(postcode)` helper that calls the **Base Adresse Nationale** (`https://api-adresse.data.gouv.fr/search/`) and returns `{ lat, lng } | null`. The BAN endpoint is the official French government geocoder — free, no API key, no rate limit for reasonable use. Returns `null` on any failure (HTTP error, unknown postcode, network down) so callers fall back to `distanceKm: null` instead of throwing.
      - In `searchRelayPoints`: resolve the postcode centroid via `geocodePostcode`, then for each relay point compute `distanceKm` rounded to 1 decimal. If centroid lookup fails, set `distanceKm: null` for all points.
  - Router
    - `app/src/routers/profile.ts`
      - No router change required — the `searchRelayPoints` procedure returns the service result directly. The new `distanceKm` field flows through automatically thanks to tRPC type inference.

## Implementation note

The original ticket assumed the npm package `codes-postaux` would provide centroid coordinates. It does not — that package only ships administrative data (`codePostal`, `codeCommune`, `nomCommune`, `libelleAcheminement`). Pivoted to the BAN API at implementation time. Same architectural pattern (server-side enrichment), one HTTP call per search instead of bundled offline data.

## Manual operations to configure services

None — the BAN API is public, no key required.

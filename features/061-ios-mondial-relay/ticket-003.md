# ticket-003 — iOS Mondial Relay point picker (list-based, with distance)

## Acceptance Criteria

- As a buyer on iOS, in the address list screen, I see a "Choisir un point relais" button (visually distinct from the home address "+ Ajouter une adresse" button)
- As a buyer on iOS, when I tap "Choisir un point relais", I land on a picker screen with a postcode input and a "Rechercher" button
- As a buyer on iOS, after I enter a valid French postcode (5 digits) and tap "Rechercher", I see a loading state, then a list of nearby relay points
- As a buyer on iOS, each relay point in the list shows name, full address (street + city + zipCode), and distance in km (e.g. "1.2 km") when available
- As a buyer on iOS, when I tap a relay point, I see a confirmation `Alert` ("Choisir ce point relais ?") and on confirm the point is saved via `profile.addresses.saveRelayPoint` and I return to the address list with the relay point as the new default
- As a buyer on iOS, when `searchRelayPoints` fails (network error, Mondial Relay API down, 5xx), I see a French error toast: "Le service Mondial Relay est indisponible. Veuillez utiliser une adresse à domicile."
- As a buyer on iOS, when the search returns zero results (unknown postcode), I see an empty state: "Aucun point relais trouvé pour ce code postal."
- As a developer, `npx tsc --noEmit` passes with zero errors

## Technical Strategy

- iOS App (`ios-app/`)
  - View — address list update
    - `ios-app/app/address/index.tsx`
      - Add a secondary button "Choisir un point relais" below "+ Ajouter une adresse", styled to indicate it's an alternative path. Navigates to `/address/relay` via `router.push`.
  - View — relay picker screen
    - `ios-app/app/address/relay.tsx` *(create)*
      - Controlled `TextInput` for postcode (keyboardType="number-pad", maxLength=5)
      - "Rechercher" button — disabled until postcode has 5 digits
      - On press: triggers a `trpc.profile.addresses.searchRelayPoints.useQuery({ postcode, country: "FR" })` with `enabled: false` + `.refetch()` pattern (lazy query)
      - Loading state: `ActivityIndicator` while the query is fetching
      - Results: `FlatList` of relay points, each card showing:
        - Name (bold)
        - Address (street + city + zipCode)
        - Distance badge: `{distanceKm} km` if distanceKm is not null, otherwise hidden
      - Empty state when results.length === 0 after a successful query: "Aucun point relais trouvé pour ce code postal."
      - Error state when the query errors: French toast (via `Alert.alert` or a `Text` banner — toast library not present on iOS) "Le service Mondial Relay est indisponible. Veuillez utiliser une adresse à domicile." + a "Retour" button
      - On item tap: `Alert.alert` with "Choisir ce point relais ?" and "Confirmer" / "Annuler". On confirm: call `trpc.profile.addresses.saveRelayPoint.useMutation` with the point's fields (`relayPointId: point.id`, `name: point.name`, `street: point.address`, `city: point.city`, `zipCode: point.zipCode`, `country: "FR"`), then `utils.profile.addresses.list.invalidate()` + `router.back()`

## Manual operations to configure services

None — Mondial Relay credentials are already configured on the backend.

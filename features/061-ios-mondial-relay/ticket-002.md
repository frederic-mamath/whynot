# ticket-002 — iOS Profile: Adresse de livraison section + home address CRUD

## Acceptance Criteria

- As a buyer on iOS, in the Profile screen, I see a new "Adresse de livraison" section between "Moyen de paiement" and "Supprimer mon compte"
- As a buyer on iOS, when I tap "Adresse de livraison", I land on a list screen showing all my saved addresses (home and any saved relay point), with the default address marked
- As a buyer on iOS, in the address list, when I tap "+ Ajouter une adresse", I see a form to enter label, street, street2 (optional), city, zipCode, country (default FR), and a "définir par défaut" toggle
- As a buyer on iOS, when I submit a valid new home address, it is saved via `profile.addresses.create` and I return to the list with the new entry visible
- As a buyer on iOS, when I tap an existing home address, I see the same form prefilled and can edit or delete the address via `profile.addresses.update` / `profile.addresses.delete`
- As a buyer on iOS, when I tap "Définir par défaut" on a non-default address, it becomes the default via `profile.addresses.setDefault`
- As a developer, `npx tsc --noEmit` passes with zero errors

## Technical Strategy

- iOS App (`ios-app/`)
  - View
    - `ios-app/app/(tabs)/profile.tsx`
      - Add a new "Adresse de livraison" section (Pressable) that navigates to `/address` via `router.push`. Place it between the existing payment method block and the delete-account button.
  - View — address list screen
    - `ios-app/app/address/index.tsx` *(create)*
      - `useQuery` on `profile.addresses.list` (use `trpc.profile.addresses.list.useQuery()`)
      - `FlatList` of addresses; each item shows label, street + city + zipCode, a "Par défaut" badge if `isDefault`, a "Point relais" badge if `mondialRelayPointId` is not null
      - Pressable item → `router.push(\`/address/\${id}\`)`
      - Floating "+ Ajouter une adresse" button at the bottom → `router.push("/address/new")`
      - Pull-to-refresh via `RefreshControl` + `utils.profile.addresses.list.invalidate()`
  - View — address form screen
    - `ios-app/app/address/new.tsx` *(create)*
      - Controlled `TextInput`s for label, street, street2, city, zipCode, country (default "FR"), and a toggle for `isDefault`
      - "Enregistrer" button → `trpc.profile.addresses.create.useMutation` → on success: invalidate list + `router.back()`
      - Country is non-editable, locked to "FR" for MVP (a `Text` showing "France"); the field is included in the payload but hidden in the UI
  - View — address edit screen
    - `ios-app/app/address/[id].tsx` *(create)*
      - Reads `id` from `useLocalSearchParams()`
      - Fetches the existing address via `profile.addresses.list` (filter client-side by id — list is small) or via a new `getById` query if absent; prefer client-side filter for now
      - Same form as `new.tsx` (extract to a shared component `ios-app/src/components/AddressForm.tsx` *(create)*)
      - "Enregistrer" → `profile.addresses.update`
      - "Définir par défaut" (only shown if not already default) → `profile.addresses.setDefault`
      - "Supprimer" (red, with `Alert.alert` confirmation) → `profile.addresses.delete` → invalidate + `router.back()`
  - Routing
    - `ios-app/app/_layout.tsx`
      - Verify the `Stack` already supports the `address/*` routes (Expo Router file-based routing handles this automatically; no change expected unless `_layout.tsx` whitelists screens explicitly)

## Manual operations to configure services

None.

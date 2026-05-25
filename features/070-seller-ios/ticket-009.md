# Ticket 009 — Deliveries: packages list + Mondial Relay label

## Goal

Replace the Livraisons stub with a real packages list. Sellers can see pending and shipped packages, generate a Mondial Relay shipping label for orders where the buyer chose a relay point, and request payouts. Manual tracking (non-Mondial Relay) is built in ticket 010.

## Acceptance Criteria

- As a seller, when I open Livraisons, I see two sections: "À expédier" (pending packages) and "Expédiés" (shipped/delivered)
- As a seller, each package row shows: buyer name, number of orders in the package, status, and creation date
- As a seller, when I tap a package that has a relay point (`hasBuyerRelayPoint: true`), I see the package detail with a weight input and "Générer l'étiquette" button
- As a seller, when I enter a weight in grams and tap "Générer", a Mondial Relay label is created — I see the tracking number and a "Voir l'étiquette" link (opens the label URL in the browser via `Linking.openURL`)
- As a seller, when I tap "Actualiser le statut" on a shipped package, the status is refreshed from the carrier
- As a seller, when a package is marked delivered, I see a "Demander le paiement" button → triggers `package.requestPayouts`
- As a seller, when no packages exist, I see a placeholder message

## Technical Strategy

- Screen — `ios-app/app/seller/deliveries/index.tsx` (replace stub)
  - `package.getPackagesForSeller.useQuery()`
  - Split into `pending` (status = "pending" | "label_generated") and `shipped` (status = "shipped" | "delivered" | "incident")
  - `SectionList` with two sections
  - Each row: buyer name, `orders.length` count badge, status chip, creation date
  - Tap → `router.push("/seller/deliveries/" + item.id)`

- Screen — `ios-app/app/seller/deliveries/[id].tsx` (create)
  - Props via `useLocalSearchParams<{ id: string }>()`
  - Re-fetch package detail from the list cache: `package.getPackagesForSeller.useQuery()` → find by id (avoids a dedicated `getPackageById` endpoint)
  - Display: buyer name + address, order items list, current status
  - **Mondial Relay path** (`hasBuyerRelayPoint === true` and status = "pending"):
    - `TextInput` for weight in grams (numeric keyboard)
    - "Générer l'étiquette" → `package.generateLabel.useMutation({ packageId, weightGrams })` → on success: show tracking number + "Voir l'étiquette" `Pressable` → `Linking.openURL(labelUrl)`
    - Loading spinner on button while generating
  - **Status refresh** (shown when `tracking_number` is set):
    - "Actualiser le statut" → `package.refreshStatus.useMutation({ packageId })` → update status in list cache
  - **Payout** (shown when status = "delivered"):
    - "Demander le paiement" → `package.requestPayouts.useMutation({ packageId })` → success toast
  - **Manual tracking path**: show "En attente du numéro de suivi" placeholder for non-Mondial Relay orders — full UI built in ticket 010

- Navigation — `ios-app/app/seller/_layout.tsx`
  - Add `deliveries/index` and `deliveries/[id]` to Stack

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Open Livraisons → pending and shipped packages displayed in sections
2. Tap Mondial Relay package → enter weight → generate label → tracking number shown, label opens in browser
3. On shipped package → tap "Actualiser" → status updates
4. On delivered package → tap "Demander le paiement" → success toast

## Manual operations to configure services

None.

# Ticket 002 — SellerDeliveriesPage UI + ProfilePage Relay Point Picker

## Acceptance Criteria

- As a seller, when I tap "Livraisons" in the seller hub, I should land on `/seller/livraisons`
- As a seller, at the top of the page, I should see a search bar to filter by buyer name or order number
- As a seller, I should see two sections: "En attente d'expédition" and "Expédiés"
- As a seller, each package card shows the live cover image, buyer name, product list, and a timeline (date d'achat / date d'expédition / date de réception)
- As a seller, clicking "Générer le label" opens a weight-input dialog, then generates the label via API and opens the PDF in a new tab
- As a seller, when the buyer hasn't saved a relay point, the "Générer le label" button is disabled with a tooltip
- As a seller, clicking "Rafraîchir l'état" polls Mondial Relay for the latest tracking status
- As a seller, on shipped packages, I see a "Demander le paiement" button that triggers per-package payout
- As a buyer, in my ProfilePage, I see a "Point Relais Mondial Relay" section
- As a buyer, I can search relay points by postcode, see a list of results, and select one to save

## Technical Strategy

- Frontend
  - Page (`app/client/src/pages/SellerDeliveriesPage/SellerDeliveriesPage.tsx`)
    - Pure view: header (back to /seller, "Livraisons" title, subtitle), search input, two sections with PackageCard lists, GenerateLabelDialog
    - Headless: all state and tRPC in `SellerDeliveriesPage.hooks.ts`
  - Hook (`app/client/src/pages/SellerDeliveriesPage/SellerDeliveriesPage.hooks.ts`)
    - `trpc.package.getPackagesForSeller.useQuery()`
    - `search` state — filters both sections (buyer name or order ID match)
    - `labelDialogPackageId` state — which package is open in the weight dialog
    - `weightInput`, `weightError` state
    - `trpc.package.generateLabel.useMutation` → on success: invalidate, toast, `window.open(labelUrl, "_blank")`
    - `trpc.package.refreshStatus.useMutation` → on success: invalidate, toast
    - `trpc.package.requestPayouts.useMutation` → on success: invalidate, toast
    - `handleGenerateLabel()`: parseInt validation + fires mutation
  - Component (`app/client/src/pages/SellerDeliveriesPage/PackageCard.tsx`)
    - Layout: live cover image (h-28, object-cover, Video icon fallback) / buyer name + status badge / product list (bullet) / timeline column (date d'achat, date d'expédition?, date de réception?) / tracking number (mono small) / action buttons
    - "Générer le label": shown for pending/label_generated status, disabled + tooltip when `!hasBuyerRelayPoint`
    - "Rafraîchir l'état": shown only when `trackingNumber` exists
    - "Demander le paiement": shown only for shipped/delivered packages (prop `onRequestPayouts?`)
  - Component (`app/client/src/pages/SellerDeliveriesPage/GenerateLabelDialog.tsx`)
    - Dialog with number input for weight in grams (min 1, max 30000)
    - Footer note: "Livraison domicile — bientôt disponible"
    - Cancel + "Générer" (disabled while pending)
  - Page (`app/client/src/pages/ProfilePage.tsx`)
    - Add "Point Relais Mondial Relay" card section below delivery addresses
    - State: `relayPostcode`, `relaySearchDone`
    - Query: `trpc.profile.addresses.searchRelayPoints({ postcode, country: "FR" })` (enabled when postcode.length >= 4 && relaySearchDone)
    - Mutation: `trpc.profile.addresses.saveRelayPoint(...)` → on success: toast + `utils.profile.me.invalidate()`
    - Display current relay point from profile addresses (where `mondialRelayPointId` is not null)
    - Results list: relay name + address + "Choisir" button
  - Routes (`app/client/src/App.tsx`)
    - Add `<Route path="livraisons" element={<SellerDeliveriesPage />} />` under `/seller` parent route (ProtectedRoute + requireRole="SELLER")
    - Remove or redirect `/pending-deliveries` route
  - Hub (`app/client/src/pages/SellerHomePage.tsx`)
    - Update card #3 ("Livraisons") link from `/pending-deliveries` to `/seller/livraisons`
  - Cleanup
    - Delete `app/client/src/pages/PendingDeliveriesPage/` folder (replaced by SellerDeliveriesPage)

## Manual operations to configure services

None — all services configured in ticket-001.

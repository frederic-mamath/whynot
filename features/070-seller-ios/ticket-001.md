# Ticket 001 — Vendre tab + seller gate

## Goal

Add a 5th "Vendre" tab visible to all authenticated users. Non-sellers see an upsell screen with a single CTA to request seller access. Sellers are routed to the seller stack (built in subsequent tickets). The tab is the entry point that drives seller acquisition.

## Acceptance Criteria

- As a non-seller, when I tap the "Vendre" tab, I see an upsell screen with a description of the benefits and a "Devenir vendeur" button
- As a non-seller, when I tap "Devenir vendeur", my request is sent and I see a confirmation message "Demande envoyée — vous serez contacté pour activer votre compte vendeur"
- As a non-seller who has already requested, when I tap "Devenir vendeur", I see "Votre demande est déjà en cours d'examen"
- As a seller (SELLER role active), when I tap the "Vendre" tab, I am immediately shown a placeholder dashboard screen with the text "Mon espace vendeur" (full dashboard built in ticket 002)
- The tab icon is a `Store` icon from lucide-react-native; label is "Vendre"

## Technical Strategy

- Navigation
  - `ios-app/app/(tabs)/_layout.tsx`
    - Import `Store` from `lucide-react-native`
    - Add a 5th `<Tabs.Screen name="vendre" />` with title "Vendre" and `Store` icon
  - `ios-app/app/(tabs)/vendre.tsx` (create)
    - Query `role.myRoles` — if `roles` includes `"SELLER"` → render `<SellerDashboardStub />` (inline placeholder for now); else → render `<SellerUpsell />`
  - `ios-app/app/seller/_layout.tsx` (create)
    - Stack navigator shell for the seller sub-section (used from ticket 002 onward)
    - `<Stack screenOptions={{ headerShown: false }} />`

- Component — `<SellerUpsell />` (inline in `vendre.tsx` for now)
  - Three benefit bullet points (revenue, visibility, simplicity)
  - "Devenir vendeur" `Pressable` → calls `role.requestSellerRole.useMutation()`
  - `onSuccess`: show inline success message (local state), disable button
  - `onError` with code `BAD_REQUEST` (already a seller) or `CONFLICT` (pending): show "Votre demande est déjà en cours d'examen"

- tRPC
  - `role.myRoles` — `useQuery()` to detect active SELLER role
  - `role.requestSellerRole` — `useMutation()` for the CTA

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Log in as non-seller → tap Vendre → see upsell
2. Tap "Devenir vendeur" → see confirmation
3. Tap again → see "déjà en cours" message
4. Log in as seller → tap Vendre → see placeholder dashboard text

## Manual operations to configure services

None.

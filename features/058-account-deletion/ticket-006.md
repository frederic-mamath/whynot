# ticket-006 — iOS: deletion blockers pre-check in profile screen

## Acceptance Criteria

- As a user, in the iOS profile screen, when I tap "Supprimer mon compte" and I have blocking orders, I should see a native alert listing the blocking product names and the reason instead of the confirmation alert
- As a user, in the iOS profile screen, when I tap "Supprimer mon compte" and I have no blockers, I should see the existing confirmation alert as before

## Technical Strategy

- Frontend (iOS)
  - Screen
    - `ios-app/app/(tabs)/profile.tsx`
      - Add `deletionBlockers` query: `trpc.auth.deletionBlockers.useQuery(undefined, { enabled: false })` — lazy, fetched on demand via `.refetch()`
      - Replace `handleDeleteAccount` with `handleRequestDelete`:
        1. Call `deletionBlockers.refetch()`
        2. If `data.blockers.length > 0`: show a native `Alert.alert("Suppression impossible", ...)` where the message body lists each blocker as `{productName} — {reason label}` (one per line, joined with `\n`), with a single "Compris" button (no destructive action)
        3. If no blockers: show the existing destructive confirmation `Alert.alert(...)` as before
      - Reason labels: `payment_pending` → "paiement en attente", `delivery_pending` → "livraison en cours", `shipment_pending` → "expédition en attente"
      - Disable the "Supprimer mon compte" `Pressable` while `deletionBlockers.isFetching`

### Manual operations to configure services

None.

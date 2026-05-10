# ticket-005 — Web: deletion blockers pre-check in ProfilePage

## Acceptance Criteria

- As a user, in the web profile page, when I click "Supprimer mon compte" and I have blocking orders, I should see a dialog listing the blocking product names and the reason (unpaid / livraison en attente / expédition en attente) instead of the confirmation dialog
- As a user, in the web profile page, when I click "Supprimer mon compte" and I have no blockers, I should see the existing confirmation dialog as before
- As a user, in the blockers dialog, I should see a "Compris" close button and no delete action

## Technical Strategy

- Frontend
  - Hook
    - `app/client/src/pages/ProfilePage/ProfilePage.hooks.ts`
      - Add `deletionBlockers` query: `trpc.auth.deletionBlockers.useQuery(undefined, { enabled: false })` — lazy, only fetched on demand
      - Add state `blockersDialogOpen: boolean` (default `false`) and `confirmDialogOpen: boolean` (default `false`)
      - Replace `handleDeleteAccount` with `handleRequestDelete`: calls `deletionBlockers.refetch()`, if `data.blockers.length > 0` sets `blockersDialogOpen(true)`, otherwise sets `confirmDialogOpen(true)`
      - Keep existing `handleDeleteAccount` (the actual mutation call) triggered from the confirm dialog's action button
      - Expose `blockersDialogOpen`, `setBlockersDialogOpen`, `confirmDialogOpen`, `setConfirmDialogOpen`, `deletionBlockers`, `handleRequestDelete` in the hook return
  - View
    - `app/client/src/pages/ProfilePage/ProfilePage.tsx`
      - Remove `AlertDialogTrigger` from the delete button — replace with a plain `ButtonV2` that calls `handleRequestDelete`, disabled while `deletionBlockers.isFetching`
      - Add a controlled `AlertDialog` for blockers (`open={blockersDialogOpen}` `onOpenChange={setBlockersDialogOpen}`):
        - Title: "Suppression impossible"
        - Description: "Les commandes suivantes bloquent la suppression de ton compte :"
        - Body: `<ul>` listing each blocker as `{productName} — {reason label}` where reason labels are: `payment_pending` → "paiement en attente", `delivery_pending` → "livraison en cours", `shipment_pending` → "expédition en attente"
        - Footer: single `AlertDialogCancel` "Compris"
      - Keep the existing confirmation `AlertDialog` but make it controlled (`open={confirmDialogOpen}` `onOpenChange={setConfirmDialogOpen}`) with its existing content

### Manual operations to configure services

None.

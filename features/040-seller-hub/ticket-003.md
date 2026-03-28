# Ticket 003 — Lives Page Redesign

## Acceptance Criteria

- As a seller, in the lives page, when I look at the page, I should see a flat layout (no tabs) with a subtitle and a "+ programmer un nouveau live" inline CTA button
- As a seller, in the lives page, when I look at the page, I should see two sections: "À venir" and "Passés", each sorted by starting datetime DESC
- As a seller, in the lives page, when I look at a live card, I should see the cover image (or a video icon fallback), a status badge, the name, date/time, description (truncated), and category chips from linked products
- As a seller, in the lives page, when I tap "+ programmer un nouveau live", I should see a schedule form in a dialog/modal
- As a seller, in the lives page, when I tap "Modifier" on a live card, I should see an edit dialog with pre-filled fields
- As a seller, in the lives page, when I tap "Supprimer" on an upcoming live card, I should see a confirmation dialog before the live is deleted
- As a seller, in the lives page, past lives should not show a delete button
- As a seller, in the lives page, after confirming deletion, the live should be removed and the list should refresh

## Technical Strategy

- Backend
  - Repository (`app/src/repositories/LiveRepository.ts`)
    - `findScheduledByHost`: Changed sort order from ASC to DESC
    - `deleteById`: New method — hard deletes `live_products` rows then the live
  - Router (`app/src/routers/live.ts`)
    - `listByHost`: Enhanced to batch-query categories via a single JOIN (no N+1) and return `categoryNames: string[]` per live
    - `delete`: New `publicProcedure` — validates host ownership and that `starts_at > now`, then calls `liveRepository.deleteById`

- Frontend
  - Deleted `app/client/src/pages/SellerLivesPage.tsx` (788-line monolithic file)
  - Component (`app/client/src/pages/SellerLivesPage/LiveCard.tsx`)
    - Vertical card: h-40 cover image with Video icon fallback, status badge (À venir / Terminé), name + formatted datetime, description (line-clamp-2), category chips, Modifier + Supprimer buttons
    - `onDelete` prop is optional — undefined for past lives hides the delete button
  - Component (`app/client/src/pages/SellerLivesPage/ScheduleLiveDialog.tsx`)
    - Extracted from the old "+ Live" tab
    - Fetches `trpc.shop.getMyShop` + `trpc.product.list` internally
    - Calls `utils.live.listByHost.invalidate()` on success and calls `onClose()`
  - Hook (`app/client/src/pages/SellerLivesPage/SellerLivesPage.hooks.ts`)
    - Fetches `trpc.live.listByHost` (refetchOnWindowFocus: false)
    - Manages all edit dialog state (name, description, date, time, cover, products)
    - Manages delete state (`deleteId`) and `trpc.live.delete.useMutation`
    - Exposes `handleEditSave` with product diff (add/remove) logic
  - Page (`app/client/src/pages/SellerLivesPage/SellerLivesPage.tsx`)
    - Pure view: consumes hook, renders flat layout with two sections
    - Inline `<ScheduleLiveDialog>`, `<AlertDialog>` for delete, `<Dialog>` for edit
  - `app/client/src/App.tsx`: Updated import path to `./pages/SellerLivesPage/SellerLivesPage`

## Manual operations to configure services

None — no third-party service configuration required.

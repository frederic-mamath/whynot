# Ticket 001 — Affichage du compteur de participants

## Acceptance Criteria

- As a viewer, in the live details page, when I watch a live stream, I should see the number of participants with a group icon at the top right of the video screen.

## Technical Strategy

- Frontend
  - Component (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`)
    - `LiveDetailsPage`: Destructure `viewerCount` from `useAgora(liveId)` (already returned by the hook but unused) and display it in the top-right corner of the first `MobilePage` using the `Users` icon from Lucide.

## Manual operations to configure services

None.

# Ticket 002 — Frontend: cover image picker in SellerLivesPage + LiveHighlight

## Acceptance Criteria

- As a seller, in the "+ Live" form, below the description, I see a "Photo de couverture" section with a file picker button and an inline preview after selection
- As a seller, in the edit dialog, I see the same cover image section with the current cover pre-displayed
- As a user, on the home page, the LiveHighlight uses the live's cover image as background when available

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/SellerLivesPage.tsx`
      - Add `coverPreview`, `selectedCoverFile` state for the new form
      - Add `editCoverPreview`, `editCoverUrl` state for the edit dialog
      - On file select: `FileReader` → base64 → preview; store file for upload
      - Before calling `scheduleMutation`: `trpc.image.upload(base64)` → get `url` → pass as `coverUrl`
      - Before calling `updateLiveMutation`: same upload flow if a new file was selected
  - Component
    - `app/client/src/components/LiveHighlight/LiveHighlight.tsx`
      - Accept `coverUrl: string | null` in `LiveHighlightData`
      - Use `coverUrl` as background image, fall back to `host.avatarUrl`

## Manual operations to configure services

- None

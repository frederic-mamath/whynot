# Ticket 002 — Frontend: LiveHighlight component & HomePage integration

## Acceptance Criteria

- As a user, on the home page, I see a rounded card with the host's avatar as background, the live name and description, a countdown, and two action buttons
- As a user, clicking "Me rappeler" downloads a `.ics` calendar file
- As a user, clicking "Partager" opens the Web Share API sheet (iOS share panel) with the URL `/live/{id}`
- As a user, if no live is scheduled, a placeholder empty block is shown

## Technical Strategy

- Frontend
  - Component
    - `app/client/src/components/LiveHighlight/LiveHighlight.tsx`
      - Accepts `live` object (typed) + `isLoading` boolean
      - Countdown hook: `useEffect` + `setInterval` computing days/hours/min/sec
      - "Me rappeler" → generates `.ics` Blob and triggers `<a>` download
      - "Partager" → `navigator.share()` with fallback to `navigator.clipboard.writeText`
      - Skeleton shown during loading
      - Placeholder block when `live === null`
    - `app/client/src/components/LiveHighlight/index.ts`
      - Re-export `LiveHighlight`
  - Page
    - `app/client/src/pages/HomePage.tsx`
      - Add `trpc.live.nextScheduled.useQuery()`
      - Render `<LiveHighlight>` above the sellers section

## Manual operations to configure services

- None

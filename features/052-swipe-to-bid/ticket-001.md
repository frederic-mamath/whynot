# Ticket 001 — SwipeToBid Component

## Acceptance Criteria

- As a buyer, when I look at the bid controls during a live auction, I should see a pill-shaped swipeable button with a draggable thumb on the left, the label "Enchèrir — Xé" in the center, and animated chevrons on the right hinting at the swipe direction
- As a buyer, when I drag the thumb to the right end of the track, my bid should be placed (calls `placeBid()`)
- As a buyer, when I release the thumb before reaching the end, it should spring back to the starting position
- As a buyer, when the bid is confirmed but the auction has already ended (server error), I should see a toast error "Enchère terminée" and the thumb should reset to its starting position
- As a buyer, the component should be disabled (non-draggable, reduced opacity) when there is no active auction

## Technical Strategy

- Frontend
  - Component (`app/client/src/components/ui/SwipeToBid/SwipeToBid.tsx`) — **new file**
    - Props: `onConfirm: () => void`, `amount: number`, `disabled?: boolean`
    - Use `motion.div` with `drag="x"` and `dragConstraints={{ left: 0, right: trackWidth - thumbSize }}`
    - Measure track width with a `ref` + `ResizeObserver` (or `useEffect` on mount)
    - On `dragEnd`: if `x.get() >= threshold (80% of track)` → call `onConfirm()` and animate thumb back; else → animate back with spring
    - Chevron animation: three `<ChevronRight />` icons with staggered `opacity` pulse using `motion` keyframes
    - Thumb: circular `motion.div` containing a `<ChevronRight />` icon
    - Styling: outer pill `bg-card border border-border`, thumb `bg-primary text-primary-foreground rounded-full`

## Manual operations to configure services

- None

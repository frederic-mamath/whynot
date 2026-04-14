# Ticket 002 — Wire SwipeToBid into LiveDetailsPage

## Acceptance Criteria

- As a buyer, when I view the live auction controls, I should see +1€/+5€/+10€ as **selector** buttons (highlighted when selected, no bid triggered on tap) and a single `SwipeToBid` below them
- As a buyer, the selected increment should be highlighted with `bg-primary text-primary-foreground`; unselected increments should be outlined
- As a buyer, the `SwipeToBid` should display the total bid amount: `currentBid + selectedIncrement`
- As a buyer, my last selected increment should be restored when I join a new auction (persisted in `localStorage` key `popup_bid_increment`); first session defaults to `1`
- As a buyer, the "Acheter tout de suite" button should no longer appear anywhere in the live controls

## Technical Strategy

- Frontend
  - Hook (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.hooks.ts`)
    - Remove the `buyout` handler (or keep for seller use only — check usage)
    - Add `bidIncrement` state: `const [bidIncrement, setBidIncrement] = useState<1|5|10>(() => Number(localStorage.getItem('popup_bid_increment') ?? 1) as 1|5|10)`
    - Add `selectIncrement(n: 1|5|10)`: sets state + writes to `localStorage`
    - Modify `placeBid` call site: no longer called from `+1/+5/+10` — called only from `SwipeToBid.onConfirm`
    - `onConfirm` handler: calls `placeBid(activeAuction.currentBid + bidIncrement)`, on tRPC error matching "auction ended" → `toast.error("Enchère terminée")`
    - Return: `bidIncrement`, `selectIncrement`, `onConfirmBid` (wraps `placeBid` + error handling)

  - View (`app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx`)
    - Replace the three `IconButton` bid buttons with three selector buttons using `bidIncrement === n` to toggle style
    - Replace `ButtonV2 label="Acheter tout de suite"` with `<SwipeToBid amount={activeAuction.currentBid + bidIncrement} onConfirm={onConfirmBid} disabled={!activeAuction} />`
    - Import `SwipeToBid` from `@/components/ui/SwipeToBid/SwipeToBid`

## Manual operations to configure services

- None

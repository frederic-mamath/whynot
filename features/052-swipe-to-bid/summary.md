# Feature 052 — Swipe to Bid

## Initial Prompt

> In the live details page, I want to add a custom secure button for users. Today, the "buy now" button is dangerous if pressed by mistake. I want the button to become a swipeable component. The +1/+5/+10 buttons should only select the bid amount — not trigger a bid directly.

---

## Design Decisions

| Decision | Choice |
|---|---|
| Swipe library | Framer Motion drag (already in project) |
| Default bid increment | Last used (persisted in `localStorage`); first session fallback = +1€ |
| Race condition handling | Toast error + swipe reset if auction has ended |
| Buyout button | Removed entirely — bidding only |
| +1/+5/+10 buttons | Become amount selectors only, no longer call `placeBid()` directly |

---

## User Stories

| User Story | Status |
|---|---|
| As a buyer watching a live, when I see the bid controls, I should see +1/+5/+10 increment selectors and a swipeable "Enchèrir" button instead of a tap button | planned |
| As a buyer, when I tap +5, the swipe button should update to show the new total bid amount | planned |
| As a buyer, when I swipe the button fully to the right, my bid should be placed | planned |
| As a buyer, when I release the swipe before reaching the end, the thumb should spring back to the start | planned |
| As a buyer, when I swipe to confirm but the auction has already ended, I should see a toast error and the button should reset | planned |
| As a buyer, the last increment I selected (+1/+5/+10) should be remembered for the next auction | planned |

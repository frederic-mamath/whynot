# Ticket 002 — Critical funnel event instrumentation

## Goal

Fire the seven events that compute the four post-launch ratios. Each event is placed at the exact point in the user flow where the action is unambiguously confirmed (after server success, not on button press).

## Acceptance Criteria

- As an operator, when a sign-up succeeds on iOS, PostHog receives `sign_up_completed` with `method: "email" | "google" | "apple"`
- As an operator, when a login succeeds on iOS, PostHog receives `login_completed` with `method: "email" | "google" | "apple"`
- As an operator, when a user enters a live with `liveStatus === "active"`, PostHog receives `live_viewed` with `live_id`, `host_id`, `is_seller_view: boolean`
- As an operator, when a bid mutation resolves successfully, PostHog receives `bid_placed` with `auction_id`, `live_id`, `amount`
- As an operator, when an `auction:ended` event arrives with `winnerId === user.id`, PostHog receives `auction_won` with `auction_id`, `live_id`, `final_price`
- As an operator, when the Stripe payment sheet is opened for an order, PostHog receives `checkout_started` with `order_id`, `amount`
- As an operator, when a Stripe payment confirms successfully, PostHog receives `purchase_completed` with `order_id`, `amount`
- All events are deduped per user via the identity stitching done in ticket 001

## Technical Strategy

- Helper — `ios-app/src/lib/analytics.ts` (create)
  - Thin typed wrapper around `usePostHog()` so the event names are not stringly-typed at the call site:
    ```ts
    type FunnelEvent =
      | { name: "sign_up_completed"; method: "email" | "google" | "apple" }
      | { name: "login_completed"; method: "email" | "google" | "apple" }
      | { name: "live_viewed"; liveId: number; hostId: number; isSellerView: boolean }
      | { name: "bid_placed"; auctionId: string; liveId: number; amount: number }
      | { name: "auction_won"; auctionId: string; liveId: number; finalPrice: number }
      | { name: "checkout_started"; orderId: string; amount: number }
      | { name: "purchase_completed"; orderId: string; amount: number };

    export function useTrack() {
      const ph = usePostHog();
      return (e: FunnelEvent) => {
        const { name, ...props } = e;
        ph?.capture(name, props);
      };
    }
    ```
  - All call sites use `const track = useTrack(); track({ name: "...", ... })`. Adding a new event = extending the union in one place.

- `sign_up_completed` — `ios-app/app/(auth)/register.tsx`
  - In the success handler of `registerMutation` (email path) call `track({ name: "sign_up_completed", method: "email" })`.
  - Also instrument the Google + Apple OAuth success paths (check `(auth)/welcome.tsx` for the OAuth call sites — likely a shared handler in `lib/`).

- `login_completed` — `ios-app/app/(auth)/login.tsx` + OAuth handlers
  - In the success handler of `loginMutation` call `track({ name: "login_completed", method: "email" })`. Same logic for OAuth methods.

- `live_viewed` — `ios-app/app/live/[liveId].tsx`
  - In `joinMutation.onSuccess`, once `liveStatus === "active"` is confirmed, call `track({ name: "live_viewed", liveId: channelId, hostId: data.channel.host_id, isSellerView: isHost })`.
  - Fire exactly once per screen entry — guard with a `useRef(false)` so React StrictMode double-effects don't double-fire.

- `bid_placed` — `ios-app/src/components/live/AuctionWidget.tsx`
  - In the success handler of the bid mutation, call `track({ name: "bid_placed", auctionId, liveId: channelId, amount: bidAmount })`.
  - Use the bid amount the user actually submitted, not the new currentBid (so a failed-then-retried bid logs the right value).

- `auction_won` — `ios-app/app/live/[liveId].tsx`
  - In the existing `auction:ended` subscription branch, after the existing `setAuctionEndInfo(...)` call, if `e.winnerId === user?.id` call `track({ name: "auction_won", auctionId: e.auctionId, liveId: channelId, finalPrice: e.finalPrice })`.
  - **Note**: verify `auctionId` is in the websocket payload — if not, fetch via `utils.auction.getActive.getData({ channelId })` or extend the WS event in `app/src/routers/auction.ts`.

- `checkout_started` — wherever Stripe `presentPaymentSheet` is called for an order
  - Grep `ios-app/` for `presentPaymentSheet` — the call lives in the auction-win → checkout flow. Fire immediately before the `presentPaymentSheet()` call returns.

- `purchase_completed` — same file as `checkout_started`
  - After `presentPaymentSheet()` resolves with no error (success branch), call the event.

- README / tracking-plan — `features/tracking-plan.md` (modify)
  - Add an "iOS funnel" section listing these 7 events, mirroring the format of the existing web tables. Status column = **exists**.

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual smoke test using a real PostHog test project:
1. Fresh install → sign up via email → PostHog Live view shows `$identify` then `sign_up_completed` with `method: "email"`
2. Open a live (any live) → `live_viewed` appears with the correct `live_id` and `host_id`
3. Place a bid → `bid_placed` appears with the right amount
4. Win the auction (use a low-traffic test live) → `auction_won` appears
5. Continue to checkout → `checkout_started` then (after Apple Pay confirm) `purchase_completed`
6. Confirm the same `distinct_id` shows in all events — funnel ratios should compute in a PostHog Insight using this distinct id as the cohort

Funnel sanity check in PostHog:
- Create an Insight → Funnel → steps: `sign_up_completed`, `live_viewed`, `bid_placed`, `purchase_completed`
- The four conversion rates between steps are the answer to the original business question

## Manual operations to configure services

PostHog dashboard:
1. Create a Funnel insight named "iOS Critical Funnel" with the 4 steps above
2. Pin it to the project home so the founder can monitor it daily without hunting
3. Set up an Alert (optional) if any step's 7-day conversion drops below a threshold

No other manual operations.

# Ticket 001 — Follow / unfollow sellers + live scheduled email notification

## Acceptance Criteria

- As a buyer, on the home page, when I tap "Suivre" on a seller card, I follow that seller and the button switches to a yellow background with black text (`bg-b-primary text-txt-primary`) to reflect the followed state.
- As a buyer, on the home page, when I tap the followed button to unfollow, a confirmation dialog appears ("Voulez-vous arrêter de suivre ce vendeur ?") and unfollowing only happens if I confirm.
- As a buyer, on `/sellers`, the same follow/unfollow behaviour applies to every seller card.
- As a buyer, when I open the home page or `/sellers`, the "Suivre" button already reflects my current follow state (followed/not followed) without any action.
- As a buyer who follows a seller, when that seller schedules a new live, I receive an email containing: the seller's username, the live title, the live description, the start date/time (French locale), and a link to join (`${FRONTEND_URL}/live/:id`).

---

## Technical Strategy

- **Backend**
  - Database
    - `app/migrations/042_create_seller_followers.ts` *(new file)*
      - Creates a `seller_followers` table: `follower_id INTEGER NOT NULL`, `seller_id INTEGER NOT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, primary key on `(follower_id, seller_id)`, foreign keys to `users.id`.
  - DB Types
    - `app/src/db/types.ts`
      - Add `SellerFollower` and `SellerFollowerTable` types and register the table in `Database`.
  - Repository *(new file)*
    - `app/src/repositories/SellerFollowerRepository.ts`
      - `follow(followerId, sellerId)`: insert into `seller_followers`, ignore if already exists.
      - `unfollow(followerId, sellerId)`: delete from `seller_followers`.
      - `findFollowerEmails(sellerId)`: returns the `email` field of all users who follow a given seller (join `seller_followers` → `users`).
  - Repository index
    - `app/src/repositories/index.ts`
      - Export `sellerFollowerRepository`.
  - Router
    - `app/src/routers/shop.ts`
      - `listSellers`: Add the current user's follow state per seller. Extend the return shape to include `isFollowed: boolean` by checking `seller_followers` for `(ctx.userId, shop.userId)`. Use a single batch query (fetch all `seller_ids` the current user follows, then compute `isFollowed` per seller in memory).
      - `listAllSellers`: Same — extend return shape with `isFollowed: boolean`.
      - `followSeller` *(new)*: `protectedProcedure` with input `{ sellerId: z.number() }`. Calls `sellerFollowerRepository.follow(ctx.user.id, input.sellerId)`.
      - `unfollowSeller` *(new)*: `protectedProcedure` with input `{ sellerId: z.number() }`. Calls `sellerFollowerRepository.unfollow(ctx.user.id, input.sellerId)`.
    - `app/src/routers/live.ts`
      - `schedule`: After `liveRepository.schedule()` succeeds, fire-and-forget: fetch follower emails via `sellerFollowerRepository.findFollowerEmails(ctx.userId)`, then call `emailService.sendLiveScheduledEmail()` for each. Do not await or block the response.
  - Email Service
    - `app/src/services/EmailService.ts`
      - `sendLiveScheduledEmail(toEmail, payload: { sellerNickname, liveName, liveDescription, startsAt: Date, liveId: number })`: new method following the existing Mailjet pattern. Subject: `"🎥 {sellerNickname} est sur le point de lancer un live !"`. HTML body: seller name, live title, description, start date formatted in French (`toLocaleDateString('fr-FR', { weekday, day, month, year, hour, minute })`), CTA button linking to `${FRONTEND_URL}/live/${liveId}`.

- **Frontend**
  - Hook
    - `app/client/src/pages/HomePage.hooks.ts`
      - Add `trpc.shop.followSeller.useMutation()` and `trpc.shop.unfollowSeller.useMutation()`. On success of either, invalidate `trpc.shop.listSellers` to refetch follow state.
      - Expose `followSeller`, `unfollowSeller`.
  - View
    - `app/client/src/pages/HomePage.tsx`
      - Replace the `ButtonV2` "Suivre" placeholder with a functional button:
        - If `seller.isFollowed`: render with `className="... bg-b-primary text-txt-primary"` and label "Suivi".
        - If not followed: keep existing outline style, label "Suivre".
      - On tap when not following: call `followSeller({ sellerId: seller.userId })`.
      - On tap when following: open an `AlertDialog` (already available in `components/ui/alert-dialog.tsx`) with message "Voulez-vous arrêter de suivre ce vendeur ?" and confirm/cancel actions. On confirm: call `unfollowSeller({ sellerId: seller.userId })`.
  - Hook
    - `app/client/src/pages/SellersPage.hooks.ts`
      - Same mutations wired up (`followSeller`, `unfollowSeller`), invalidating `trpc.shop.listAllSellers` on success.
  - View
    - `app/client/src/pages/SellersPage.tsx`
      - Apply the same follow/unfollow button logic as `HomePage.tsx`.

---

## Manual operations to configure services

- **Mailjet**
  - No new API keys needed — the existing `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_FROM_EMAIL`, `MAILJET_FROM_NAME` env vars are reused.
  - Ensure `FRONTEND_URL` is set in the backend `.env` (e.g., `https://popup-live.fr`).

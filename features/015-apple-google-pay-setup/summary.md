# Feature 015 — Apple Pay / Google Pay Payment Setup

## Overview

Allow buyers to configure a payment method (card, Apple Pay, Google Pay) via Stripe SetupIntent. Display payment status in profile, and block bids/buyouts unless a payment method is saved.

## User Stories

| User Story                                                                                                      | Status    |
| :-------------------------------------------------------------------------------------------------------------- | :-------- |
| As a user, in the profile page, I can see if I have a payment system configured                                 | completed |
| As a user, in the profile page, I can add a payment method (card, Apple Pay, Google Pay)                        | completed |
| As a buyer, in the channel details page, when I try to bid without a payment method, I see a blocking dialog    | completed |
| As a buyer, in the channel details page, when I try to buyout without a payment method, I see a blocking dialog | completed |
| As a buyer, I cannot place a bid server-side without a saved payment method (defense-in-depth)                  | completed |

## Tickets

| Ticket                      | Description                                   | Status    |
| :-------------------------- | :-------------------------------------------- | :-------- |
| [ticket-01](./ticket-01.md) | Backend: Stripe Customer & SetupIntent        | completed |
| [ticket-02](./ticket-02.md) | Frontend: Payment Setup Dialog & Profile Page | completed |
| [ticket-03](./ticket-03.md) | Frontend: Bid Guard & Payment Required Dialog | completed |

## Architecture Decisions

- **SetupIntent** (not manual capture): Verify card is registered without holding funds. Actual payment on /my-orders after winning.
- **`stripe_customer_id`** added to `users` table (migration 021) — distinct from `stripe_account_id` (Connect sellers).
- **`payment_method_types: ['card']`** on SetupIntent: Restricts to cards, which automatically surfaces Apple Pay / Google Pay wallets. Avoids Klarna, Bancontact, etc.
- **Blocking dialog**: Impossible to bid or buyout without a saved payment method (frontend + backend guard).
- **`VITE_STRIPE_PUBLISHABLE_KEY`** must be set in the **build** environment on Render — it is a Vite build-time variable (`import.meta.env.*`) and will be `undefined` at runtime if missing, causing an infinite spinner.

# iOS Profile — Payment Method Management

## Initial Prompt

As an iOS buyer, I want to be able to add and manage a payment method from the Profile page, the same way I can on the web app. Must support card entry via Stripe and Apple Pay. Google Pay is out of scope (Android only, future).

## Context

The profile page currently shows a saved card and a delete button, but has no way to **add** a payment method. The only entry point is the `BidRequirementsSheet` during a live bid — which is too late. Buyers who haven't set up payment can win an auction they can't pay for, blocking the seller.

## Out of Scope

- Google Pay (Android, future)
- Delivery address management
- Changes to the `BidRequirementsSheet` bid flow

## Tickets

| Ticket | Description | Status |
|:-------|:------------|:-------|
| ticket-010 | Add card from Profile — "Ajouter une carte" button + `PaymentSetupSheet` in profile | ✅ |
| ticket-011 | Apple Pay — merchant cert setup + save Apple Pay as card-on-file from profile | ✅ |

## User Stories

| User Story | Status |
|:-----------|:-------|
| As a buyer, on the Profile page, when no card is saved, I can tap "Ajouter un moyen de paiement" to add a card | ✅ |
| As a buyer, on the Profile page, I can save my Apple Pay as a payment method | ✅ |

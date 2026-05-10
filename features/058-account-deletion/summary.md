# Account Deletion

## Initial Prompt

Apple App Store guideline 5.1.1(v) requires that any app allowing account creation must offer in-app account deletion. Popup has no account deletion today. This feature adds it across backend, web, and iOS.

## Context

- Required for App Store approval — guaranteed rejection without it
- Buyers create accounts via email, Google, or Apple OAuth
- Stripe customer record must be cleaned up on deletion
- JWT tokens are stateless (7-day expiry) — deletion is enforced by making the account non-existent rather than blocklisting tokens
- Hard delete via existing `UserRepository.deleteById()` — DB cascades handle related records (verify during ticket-001)

## Out of Scope

- Seller account deletion (sellers have Stripe Connect accounts with potential outstanding payouts — different flow)
- Data export before deletion
- Grace period / reactivation window

## Tickets

| Ticket | Description | Status |
|:-------|:------------|:-------|
| ticket-001 | Backend — `auth.deleteAccount` mutation | completed |
| ticket-002 | Web — delete account UI in ProfilePage | completed |
| ticket-003 | iOS — delete account UI in profile screen | completed |
| ticket-004 | Backend — `auth.deletionBlockers` query + guard in `deleteAccount` | completed |
| ticket-005 | Web — deletion blockers pre-check in ProfilePage | completed |
| ticket-006 | iOS — deletion blockers pre-check in profile screen | completed |

## User Stories

| User Story | Status |
|:-----------|:-------|
| As a buyer, in the web profile page, I can permanently delete my account | completed |
| As a buyer, in the iOS profile screen, I can permanently delete my account | completed |
| As a buyer, after deleting my account, I am logged out and cannot log back in | completed |
| As a buyer with unpaid orders, when I try to delete my account, I am blocked and shown which orders are pending | completed |
| As a buyer with packages in transit, when I try to delete my account, I am blocked and shown which packages are not yet delivered | completed |
| As a seller with paid orders not yet shipped, when I try to delete my account, I am blocked and shown which orders are waiting to be shipped | completed |

# Feature 067 — Eliminate Post-Save Lag

## Initial Prompt

> When updating inputs in the profile page, there is a time gap between when the value is updated and when the display reflects it. This causes a lagging feeling in the UX.

## Context

After a mutation succeeds, the app calls `utils.X.invalidate()` which triggers a server refetch. Until that refetch resolves (200–500ms), the UI still shows old cached data. This affects 28+ mutation sites across both platforms.

The fix is documented in `app/client/CLAUDE.md` and `ios-app/CLAUDE.md` under "Cache Update Strategy": use `setData()` to patch the cache immediately in `onSuccess`, then still call `invalidate()` in the background for consistency.

**Exception:** the live page is excluded from this feature — concurrent buyer actions make optimistic updates unsafe there. It will have its own custom strategy.

## Approach

Replace `invalidate()`-only `onSuccess` handlers with `setData()` + background `invalidate()` on all non-live pages where:
1. The mutated data is immediately visible on the same screen
2. The new value is derivable from the mutation input (no server-computed unknowns)

## Tickets

| Ticket | Description | Status |
| :--- | :--- | :--- |
| ticket-001 | Web app — profile, address, payment, seller, shop, live-schedule pages | planned |
| ticket-002 | Mobile app — profile screen and address screens | planned |

## User Stories

| User Story | Status |
| :--- | :--- |
| As a buyer/seller on web, when I save my name, the profile page reflects it instantly with no visible lag | planned |
| As a buyer/seller on web, when I add/edit/delete an address, the list updates instantly | planned |
| As a seller on web, when I schedule or delete a live, the live list updates instantly | planned |
| As a seller on web, when I follow or unfollow a seller, the button state updates instantly | planned |
| As a buyer/seller on mobile, when I save my name, the profile screen reflects it instantly | planned |
| As a buyer on mobile, when I set or delete an address, the address list updates instantly | planned |

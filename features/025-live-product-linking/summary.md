# Feature 025 — Live Product Linking

## Initial Prompt

> As a seller, in the SellerLivesPage and the 'new' tab, I want to see the list of the products from my shop to be able to link them to the new live. When clicking on an existing live, I should see a dialog with the list of my shop's products and be able to link or unlink them. I should also be able to modify the start and end date of the live.

## Objective

Allow sellers to:

1. Associate products from their shop to a new live when scheduling it
2. View and edit an existing scheduled live (name, description, date/time)
3. Link or unlink products from an existing live via a dialog

## Tickets

| #         | Title                                      | Status  |
| --------- | ------------------------------------------ | ------- |
| ticket-01 | Backend: `live.update` mutation            | ✅ Done |
| ticket-02 | Frontend: Product checkboxes in +Live form | ✅ Done |
| ticket-03 | Frontend: Edit dialog for existing lives   | ✅ Done |

## Files Modified

### Backend

- `app/src/repositories/LiveRepository.ts` — Added `update()` method
- `app/src/routers/live.ts` — Added `live.update` mutation

### Frontend

- `app/client/src/pages/SellerLivesPage.tsx` — Full rewrite with product section + edit dialog

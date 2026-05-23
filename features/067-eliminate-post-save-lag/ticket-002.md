# Ticket 002 — Mobile app: setData() on profile and address screens

## Goal

Replace `invalidate()`-only `onSuccess` handlers with `setData()` + background `invalidate()` on the mobile profile tab and address screens. Live screen excluded — see `ios-app/CLAUDE.md`.

## Acceptance Criteria

- As a buyer/seller, when I save my first or last name on the profile tab, the name rows update instantly — no visible lag before the refetch
- As a buyer/seller, when I delete a payment method on the profile tab, the card disappears instantly
- As a buyer, when I set an address as default in the address list, the default badge switches instantly
- As a buyer, when I delete an address from the address list, the row disappears instantly
- As a buyer, when I set an address as default from the address detail screen, the badge switches instantly on return
- The live screen (`app/live/[liveId].tsx` and `src/components/live/`) is untouched

## Technical Strategy

- Mobile (`ios-app/`)
  - The pattern for every site below is identical:
    ```ts
    onSuccess: (data, input) => {
      utils.X.Y.setData(args, (old) => old ? { ...old, ...patch } : old);
      utils.X.Y.invalidate(args);
    }
    ```
  - Screen *(modify)* — `app/(tabs)/profile.tsx`
    - `updateMutation` (`trpc.profile.update`) → `setData` on `utils.profile.me`: patch `firstName`, `lastName` from `input`
    - `deleteMutation` (`trpc.payment.deletePaymentMethod`) → `setData` on `utils.payment.getPaymentStatus`: filter out method with `input.paymentMethodId` from `paymentMethods` array
  - Screen *(modify)* — `app/address/index.tsx`
    - `setDefaultMutation` → `setData` on `utils.profile.addresses.list`: mark `input.id` as `isDefault: true`, all others `isDefault: false`
    - `deleteMutation` → `setData` on `utils.profile.addresses.list`: filter out address with `input.id`. Also `setData` on `utils.profile.me` to keep both caches consistent
  - Screen *(modify)* — `app/address/[id].tsx`
    - `setDefaultMutation` (if present) → same `setData` pattern as `address/index.tsx`

## Note on setData shape

Before writing each `setData` call, verify the exact cached object shape by checking the tRPC router return type in `app/src/routers/`. The `old` argument in `setData` is typed — TypeScript will catch mismatches at build time (`npx tsc --noEmit`).

## Verification

```bash
cd ios-app && npx tsc --noEmit   # zero TypeScript errors
```

Manual checklist:
1. Profile tab → save name → first/last name rows update instantly
2. Profile tab → delete card → payment section updates instantly
3. Address list → set default → badge switches instantly without reload
4. Address list → delete → row disappears instantly

## Manual operations to configure services

None.

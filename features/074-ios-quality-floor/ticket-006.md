# Ticket 006 — Migrate all mutations to error-surfacing hooks

## Goal

Sweep every `useMutation` call site in `ios-app/` to use `useMutationWithToast` from T-005. Replace the three current error-display patterns (`Alert.alert`, inline `<Text>`, silently dropped) with the single banner convention — with one exception: **form screens keep inline errors** (`PersonalInfoForm`, `AddressForm`, login, register) because inline beside the field is correct UX.

After this ticket, `Alert.alert` only appears in `src/lib/alerts.ts`. The R8 arch rule from T-003 enforces this going forward (most exclusions are removed from `R8_EXCLUDE`).

## Acceptance Criteria

- As a buyer, when my payment fails (network error, declined card, initPaymentSheet error), I see a clear message instead of a stuck spinner
- As a buyer, when my bid fails (auction ended, requirements unmet, network), I see why
- As a buyer, when I save an address and it fails, the form shows the inline error AND the banner appears (defense in depth)
- As a seller, when highlighting / unhighlighting a product fails, I see why (today it's silently dropped — `// ignore`)
- As a seller, when ending an auction or ending a live fails, I see why
- As a developer, `npm run arch:test` passes with R8 effectively enforced (only `src/lib/alerts.ts` left in `R8_EXCLUDE`)

## Technical Strategy

- Frontend / Migration of action mutations (banner)
  - `ios-app/app/(tabs)/orders.tsx` — `handlePayNow`: replace try/finally with explicit `useMutationWithToast` on `createPaymentIntent` + surface `initPaymentSheet.error` and `presentPaymentSheet.error` via banner
  - `ios-app/app/live/[liveId].tsx` — `toggleInterestMutation`, `joinMutation`, `leaveMutation`: wrap; remove the silent `onError: () => setLiveStatus("ended")` swallow
  - `ios-app/app/seller-live/[liveId].tsx` — remove all `// ignore` and empty catch blocks (lines ~213, ~179-181); wrap `startMutation`, `endLiveMutation`, `highlightMutation`, `unhighlightMutation`, `createAuctionMutation`, `endAuctionMutation`
  - `ios-app/app/address/index.tsx` — `setDefaultMutation`, `deleteMutation`: replace `Alert.alert(error)` with wrapped mutation
  - `ios-app/app/address/relay.tsx` — `saveMutation`: replace `Alert.alert` with wrapped mutation
  - `ios-app/app/(tabs)/seller/products/new.tsx`, `[id].tsx`, `lives/new.tsx`, `lives/[id].tsx`, `deliveries/[id].tsx` — replace `Alert.alert(error)` with wrapped mutation
- Frontend / Migration of form mutations (inline + banner)
  - `ios-app/app/address/[id].tsx` — `updateMutation`, `setDefaultMutation`, `deleteMutation`: keep `setError(e.message)` for inline display, ALSO wrap with banner
  - `ios-app/app/onboarding.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx` — keep inline errors as primary surface; only call banner for non-field-specific failures
- Logging cleanup
  - `ios-app/src/components/live/ChatPanel.tsx` — remove `console.log("[message.subscribe] ERROR", ...)`, surface via banner
- Arch-test cleanup
  - `scripts/arch-test.mjs` — shrink `R8_EXCLUDE` to `["ios-app/src/lib/alerts.ts"]` once all sweeps land

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint
```

Manual: with WiFi off, attempt to pay an order → banner. Attempt to bid → banner. Attempt to save address → inline error + banner. End an auction with a forced server error → banner.

## Manual operations to configure services

None.

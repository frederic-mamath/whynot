# Ticket 001 — SwipeToConfirm component + wire into BidRequirementsSheet

## Goal

Replace the "Confirmer l'enchère" tap button with a swipe-to-confirm track that is physically impossible to trigger accidentally. Zero new dependencies — built with React Native's built-in `PanResponder` + `Animated`.

## Acceptance Criteria

- As a buyer, when I open the bid sheet and both requirements are met (name + payment method), I should see a pill-shaped swipe track with a draggable thumb on the left and the label "Glisser pour enchérir" in the center
- As a buyer, when I drag the thumb fully to the right (≥ 80% of track width), my bid should be placed — identical to tapping the old confirm button
- As a buyer, when I release the thumb before the 80% threshold, it should animate back to the start with a spring — no bid is placed
- As a buyer, when requirements are not met, the swipe track should appear visually muted (reduced opacity) and be non-draggable — same disabled state as the old button
- As a buyer, when the bid mutation is pending (network in flight), the track should be non-draggable and show an `ActivityIndicator` in the thumb — preventing double-submission
- As a buyer, when the bid succeeds or fails, the thumb should spring back to the start position (so the sheet can be dismissed cleanly)

## Technical Strategy

- Mobile (`ios-app/`)
  - Component *(create)*
    - `ios-app/src/components/live/SwipeToConfirm.tsx`
      - Props: `onConfirm: () => void`, `label: string`, `disabled?: boolean`, `loading?: boolean`
      - Layout: outer pill `View` (full width, height 56, `Colors.primary` background, `Radius.xl`) with the label `Text` centered. Thumb: circular `Animated.View` (size 48, `Colors.primaryForeground` background, positioned absolute left with padding 4) containing a `<ChevronRight>` icon (or `›` text).
      - Track width measured via `onLayout` on the outer View; stored in a `useRef` so the `PanResponder` closure always sees the latest value without recreating the responder.
      - `maxX = trackWidth - thumbSize - trackPadding * 2` (computed from the ref)
      - `PanResponder.create`:
        - `onStartShouldSetPanResponder`: returns `!disabled && !loading`
        - `onMoveShouldSetPanResponder`: returns `!disabled && !loading`
        - `onPanResponderMove`: clamps `dx` to `[0, maxX]`, calls `translateX.setValue(clamped)`
        - `onPanResponderRelease`: if `dx >= maxX * 0.8` → animate to `maxX` (100ms), then call `onConfirm()`, then spring back to 0; else → spring back to 0 immediately
      - `translateX`: `useRef(new Animated.Value(0)).current`
      - Thumb animated style: `{ transform: [{ translateX }] }`
      - Use `Colors.primary`, `Colors.primaryForeground`, `Radius.xl`, `Spacing.*` from `src/theme/tokens`
      - Disabled state: wrap outer View in `opacity: disabled ? 0.4 : 1`

  - Component *(modify)*
    - `ios-app/src/components/live/BidRequirementsSheet.tsx`
      - Remove: the `confirmButton` `Pressable` and its `StyleSheet` entries (`confirmButton`, `buttonDisabled`, `confirmText`)
      - Add at the bottom of the sheet (same position): `<SwipeToConfirm label="Glisser pour enchérir" onConfirm={confirmBid} disabled={!bothMet} loading={placeBidMutation.isPending} />`
      - Import `SwipeToConfirm` from `./SwipeToConfirm`
      - No changes to `confirmBid`, `placeBidMutation`, or any other logic

## Verification

```bash
cd ios-app && npx tsc --noEmit   # zero errors
```

Manual test checklist:
1. Open a live with an active auction
2. Tap "Enchérir" — sheet opens, swipe track visible
3. Drag thumb < 80% → release → thumb springs back, no bid placed
4. Drag thumb ≥ 80% → bid fires, sheet closes
5. Trigger with requirements missing → track is muted and non-draggable

## Manual operations to configure services

None.

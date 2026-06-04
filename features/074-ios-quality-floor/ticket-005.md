# Ticket 005 — useErrorBanner + useMutationWithToast hooks

## Goal

Ship the two primitives that ticket 006 will use to sweep the codebase: a global error banner mounted at the root layout, and a tRPC mutation wrapper that surfaces failures through that banner by default.

No call sites are migrated in this ticket — that's T-006. The point is to ship the infrastructure first so the sweep in T-006 is purely mechanical.

This ticket also creates `src/lib/alerts.ts` — the canonical wrapper for destructive confirmation dialogs and the one place R6 allows `Alert.alert` to live.

## Acceptance Criteria

- As a developer, when I call `useErrorBanner().showError(message)` from any screen, a dismissible banner appears at the top of the app
- As a developer, when I wrap a mutation with `useMutationWithToast`, any thrown error or `onError` payload is surfaced through the banner automatically (caller can still override `onError`)
- As a developer, the banner auto-dismisses after 4 seconds or on tap
- As a developer, `src/lib/alerts.ts` exports `confirm({ title, message, destructiveLabel?, cancelLabel? })` returning `Promise<boolean>` — the only sanctioned use of `Alert.alert` in the app
- As a developer, the existing app behavior is unchanged (no call sites migrated yet)

## Technical Strategy

- Frontend / Context + banner
  - `ios-app/src/contexts/ErrorBannerContext.tsx`
    - `ErrorBannerProvider` exposing `{ showError(message: string): void; clearError(): void }` via context
    - Internal state: `current: { id: string; message: string } | null`
    - Auto-dismiss timer (4s) cleared on tap, new message, or unmount
  - `ios-app/src/components/ErrorBanner.tsx`
    - Reads from `ErrorBannerContext`
    - Positioned absolutely at the top of the app (above all stacks)
    - Styling: `Colors.destructive` background, `Colors.destructiveForeground` text, `Radius.md`, `Spacing.lg` padding
- Frontend / Hooks
  - `ios-app/src/hooks/useErrorBanner.ts`
    - `() => useContext(ErrorBannerContext)` — thin convenience wrapper
  - `ios-app/src/hooks/useMutationWithToast.ts`
    - Generic wrapper around `useMutation` that injects a default `onError` calling `showError(err.message)` unless the caller provides their own
    - Signature mirrors tRPC's `useMutation` generics so existing call shapes work unchanged
- Frontend / Alerts
  - `ios-app/src/lib/alerts.ts`
    - `confirm(opts: { title: string; message: string; destructiveLabel?: string; cancelLabel?: string }): Promise<boolean>`
    - Implementation uses `Alert.alert` (the ONE allowed call site per R6)
- Wire-up
  - `ios-app/app/_layout.tsx`
    - Wrap existing provider stack with `<ErrorBannerProvider>`
    - Render `<ErrorBanner />` immediately inside the provider, above the navigation stack

## Verification

```bash
cd ios-app && npx tsc --noEmit && npm run arch:test && npm run lint
```

Manual: add a temporary debug button that calls `showError("test")` → banner appears → tap to dismiss → auto-dismiss confirmed.

## Manual operations to configure services

None.

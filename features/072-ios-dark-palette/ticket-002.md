# Ticket 002 — Auth, tab nav, profile, address screens

## Goal

Walk through the "shell" screens — auth group, root tab bar, profile, address management — and fix any visual regressions introduced by the palette swap in ticket-001. Replace hardcoded color strings that bypass the token system, fix contrast issues, ensure every interactive element is legible.

These screens are the first surfaces a user touches, so they have to look right even if the buyer/seller screens (tickets 003–004) aren't done yet.

## Acceptance Criteria

- As a user, on welcome / login / register / onboarding, every input, button, link, and helper text is legible
- As a user, the tab bar uses the new palette — active tab is lime-yellow, inactive is muted, the bar surface is `Colors.card` or `Colors.background`
- As a user, on the profile screen, every section (name, payment methods, account actions) is legible
- As a user, on address screens (list, new, edit, relay picker), every form field and CTA reads correctly
- No hex codes in any of the screens listed below (validated via `npm run arch:test`)
- No raw color strings (`"white"`, `"black"`, `"#fff"`, `"rgba(255,255,255,...)"` for text) — these all bypass tokens
- `npx tsc --noEmit` passes

## Technical Strategy

- Screens to audit (each one: open it, look at it, find regressions, fix using `Colors.*`):
  - `ios-app/app/(auth)/welcome.tsx`
  - `ios-app/app/(auth)/login.tsx`
  - `ios-app/app/(auth)/register.tsx`
  - `ios-app/app/onboarding.tsx`
  - `ios-app/app/(tabs)/_layout.tsx` — set `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarStyle.backgroundColor`, `tabBarStyle.borderTopColor` to `Colors.*` tokens. The current code hardcodes `"#7C3AED"` / `"#9CA3AF"` / `"#E5E7EB"` — replace them.
  - `ios-app/app/(tabs)/profile.tsx`
  - `ios-app/app/address/_layout.tsx`
  - `ios-app/app/address/index.tsx`
  - `ios-app/app/address/new.tsx`
  - `ios-app/app/address/[id].tsx`
  - `ios-app/app/address/relay.tsx`

- Shared components (audit + fix):
  - `ios-app/src/components/SocialAuthButtons.tsx` — currently uses `backgroundColor: "#000"` for Apple, `"#fff"` for Google, `"#DADCE0"` border etc. In a dark theme, those still mostly work (Apple's button is supposed to be black, Google's white) — but verify Google's button still looks Google-branded against a dark background. Leave Apple as-is. For Google, Google's brand guidelines allow both a light and dark variant — if needed, switch to the dark variant; otherwise keep.

- Style sweep pattern for each file:
  1. Search for `"#`, `"rgb`, `"rgba`, `"white"`, `"black"` — any literal color string
  2. For each match: replace with the appropriate `Colors.*` token, OR justify in a one-line comment why a literal is correct (e.g. Apple sign-in button brand requirement)
  3. Test in simulator that the screen still reads cleanly

- Tab bar specifically — `ios-app/app/(tabs)/_layout.tsx`:
  ```tsx
  screenOptions={{
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.mutedForeground,
    tabBarStyle: {
      backgroundColor: Colors.background,
      borderTopColor: Colors.border,
      borderTopWidth: 1,
    },
    headerShown: false,
  }}
  ```

## Verification

```bash
cd ios-app
npx tsc --noEmit
npm run arch:test
```

Manual:
1. Logout if logged in → welcome screen looks polished
2. Tap Login → fill form → screen reads correctly
3. Tap Register → fill form
4. Sign up flow → onboarding → readability OK
5. Land on tabs → tab bar uses lime active color
6. Profile tab → every section readable
7. Edit address → form readable, save button styled with token

## Manual operations to configure services

None.

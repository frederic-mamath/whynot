# Feature 072 — iOS dark palette (brand alignment with web)

## Initial prompt

> "As an iOS app user, I would like a dark theme. I should be able to switch between light and dark mode from the profile page. The dark theme should have the closest color palette from the web app with the dark background and yellowish letter styles."

## Scope decision

After PO discussion (see conversation history), the request was reframed:

- The web app is **permanently dark** — it has no light variant and no toggle. It uses near-black surfaces (`rgb(13,13,13)`), cream foreground (`rgb(240,240,232)`), and a lime-yellow primary (`rgb(224,255,0)` — the "yellowish" the user noticed).
- The iOS app currently uses an independent light palette (white background, dark text, purple primary) that does not match the web brand.
- The user's underlying goal is **brand consistency with the web app**, not user choice over light vs dark.

**This feature implements Option A: replace the iOS mobile palette with the web's dark palette. No in-app toggle. No light variant maintained.** That matches the web product exactly and avoids the substantial cost of maintaining two palettes forever.

## Explicitly out of scope

- Light/dark toggle on the profile page (Option B). If light mode is ever wanted later, it's a separate feature.
- System dark/light preference detection (`useColorScheme()`). The app is dark-only after this feature, regardless of the device setting. `userInterfaceStyle` is locked to `"dark"`.
- Web app changes — its tokens are already where iOS is heading; nothing to change there.
- New App Store screenshots. The current screenshots show the purple identity and will be visibly stale post-merge. **Manual operation**: re-shoot screenshots before the next App Store submission. Flagged in ticket-001 acceptance criteria.

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a user, when I open the app, every surface uses the same dark palette as the web app | completed |
| As a user, the launch splash screen is dark — no white flash before the app loads | completed |
| As a user, primary action buttons are lime-yellow with dark text — the same as the web CTAs | completed |
| As a user, the auth screens (welcome / login / register / onboarding) read cleanly against the dark background | completed |
| As a user, the tab bar and profile screen use the new dark surfaces with correct contrast | completed |
| As a user, the home feed, lives tab, live viewer, and orders screen are visually consistent with the rest of the app | completed |
| As a seller, the Vendre tab, dashboard, inventory, lives management, broadcaster screen, and deliveries are all visually consistent | completed |

## Ticket sequence

The work is split into 4 atomic tickets. Each leaves the app buildable, but only after ticket-004 ships is every screen guaranteed to look polished. Earlier tickets may leave isolated screens with contrast bugs — those are fixed in their respective later ticket.

| # | Scope | Risk if shipped alone |
|---|-------|----------------------|
| 001 | Palette swap in `tokens.json` + regen + system surfaces (splash, status bar, `userInterfaceStyle`) + CLAUDE.md doc update | Some screen-specific colors will look wrong (e.g. white-on-white text where a screen assumed light bg). Functional, not polished. |
| 002 | Auth screens + tab nav + profile + address — "the shell" | The buyer + seller screens still need their own pass. |
| 003 | Buyer journey: home, lives tab, live viewer, orders | Seller screens still need a pass. |
| 004 | Seller journey: Vendre, dashboard, products, lives mgmt, broadcaster, deliveries | Feature complete. |

## Color mapping for ticket-001 reference

| Mobile token | Old value (light) | New value (web-aligned dark) | Source |
|--------------|------------------|------------------------------|--------|
| `background` | `#FFFFFF` | `#0D0D0D` | web `rgb(13,13,13)` |
| `foreground` | `#111827` | `#F0F0E8` | web `rgb(240,240,232)` |
| `card` | `#F9FAFB` | `#141414` | web `rgb(20,20,20)` |
| `card-foreground` | `#111827` | `#F0F0E8` | web `rgb(240,240,232)` |
| `popover` | `#FFFFFF` | `#141414` | reuse card (mobile-only key) |
| `popover-foreground` | `#111827` | `#F0F0E8` | reuse card-foreground |
| `primary` | `#7C3AED` (purple) | `#E0FF00` (lime) | web `rgb(224,255,0)` |
| `primary-foreground` | `#FFFFFF` | `#0D0D0D` | dark text on yellow CTA |
| `secondary` | `#F3F4F6` | `#2A2A2A` | derived from web `border`/`border-light` |
| `secondary-foreground` | `#111827` | `#F0F0E8` | reuse foreground |
| `muted` | `#F3F4F6` | `#2A2A2A` | reuse secondary surface |
| `muted-foreground` | `#6B7280` | `#777777` | web `rgb(119,119,119)` |
| `accent` | `#EDE9FE` (purple tint) | `#2A2A2A` | dark surface for accent backgrounds |
| `accent-foreground` | `#7C3AED` | `#E0FF00` | brand yellow for accent text |
| `destructive` | `#EF4444` | `#EF4444` | unchanged — same red works on dark |
| `destructive-foreground` | `#FFFFFF` | `#FFFFFF` | unchanged |
| `border` | `#E5E7EB` | `#2A2A2A` | web `rgb(42,42,42)` |
| `input` | `#F9FAFB` | `#232323` | web `rgb(35,35,35)` |
| `input-hint` | `#9CA3AF` | `#787878` | web `rgb(120,120,120)` |
| `ring` | `#7C3AED` | `#E0FF00` | reuse primary |
| `success` | `#10B981` | `#22C55E` | web `rgb(34,197,94)` |
| `success-foreground` | `#FFFFFF` | `#0D0D0D` | dark text on green |
| `warning` | `#F59E0B` | `#EAB308` | web `rgb(234,179,8)` |
| `warning-foreground` | `#FFFFFF` | `#0D0D0D` | dark text on yellow |
| `info` | `#3B82F6` | `#3B82F6` | unchanged |
| `info-foreground` | `#FFFFFF` | `#FFFFFF` | unchanged |

Notes:
- Web uses `oklch(...)` for some keys (secondary, popover, accent, ring). Mobile cannot — React Native's StyleSheet doesn't parse oklch. Where the web key was oklch, the mapping above picks a hex value that matches the visual intent in the new dark context.
- The `accent-foreground` is the only place lime-yellow appears as text (e.g. tags, active state highlights). Body text is always cream (`#F0F0E8`), not yellow.

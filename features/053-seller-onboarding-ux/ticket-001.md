# Ticket 001 — Collapse step list + progress bar bullets + tooltips

## Acceptance Criteria

- As a seller, on the onboarding page, I should see only the active step card (step name + form) — completed and locked step rows are not rendered
- As a seller, I should see 11 bullet points positioned along the progress bar, visually reflecting each step's state:
  - Completed: filled primary color circle
  - Active: larger circle, outlined in foreground color
  - Locked: small muted/empty circle
- As a seller on desktop, when I hover over a bullet, I should see a tooltip with the corresponding step name
- As a seller on mobile, when I tap a bullet, I should see a brief tooltip (Sonner toast) with the corresponding step name
- As a seller, the "Étape X / 11" counter above the bar and the progress fill remain unchanged
- The app must build with zero TypeScript errors

## Technical Strategy

- Frontend
  - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
    - **Step list**: replace the `STEPS.map(...)` block with a single rendered card for the active step only. Remove the outer `<div className="flex flex-col gap-3">` list entirely. The active card keeps its existing markup (numbered circle + step label + form below).
    - **Progress bar**: replace the current single `<div>` bar with a relative container. Render 11 absolutely-positioned bullet `<button>` elements along the bar at `left: (index / (STEPS.length - 1)) * 100 + '%'`. Each bullet reads its state from `index < currentStepIndex` (completed), `index === currentStepIndex` (active), or locked.
      - Completed bullet: `w-3 h-3 rounded-full bg-primary`
      - Active bullet: `w-4 h-4 rounded-full border-2 border-foreground bg-background`
      - Locked bullet: `w-2.5 h-2.5 rounded-full bg-muted`
    - **Desktop tooltip**: wrap each bullet in a `group relative` container. Add a `<span>` sibling with `absolute bottom-full mb-2 ... hidden group-hover:block` — standard Tailwind tooltip pattern. No external library needed.
    - **Mobile tooltip**: on bullet `onClick`, call `toast(step.label, { duration: 1500 })` from Sonner. Guard with a media query check or a `md:` class on the onClick handler — on desktop the hover tooltip is sufficient, but firing the toast on click is harmless too and simplifies the implementation.
    - **Remove bounce animation**: delete `isAnimating && "animate-[popup-bounce_0.5s_ease-out]"` class and the `onAnimationEnd` / `clearCompletedAnimation` prop from the active step row (the hook state can stay — it will be reused in ticket-002 for the bullet animation).

## Out of scope

- Particle animation on bullet (ticket-002)
- Any changes to form content inside each step
- Backend / DB changes

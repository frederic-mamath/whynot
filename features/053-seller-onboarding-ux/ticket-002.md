# Ticket 002 — Particle pop animation on completed bullet

**Depends on**: ticket-001

## Acceptance Criteria

- As a seller, when I complete a step, the bullet for that step should play a brief pop + particle burst animation
- The particles should radiate outward from the bullet center and fade out within ~600ms
- The progress bar fill and other bullets are not affected during the animation
- On both mobile and desktop
- The app must build with zero TypeScript errors

## Technical Strategy

- Frontend
  - `app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx`
    - **Trigger**: the hook already exposes `justCompletedStepIndex` (set in `invalidateAndAnimate`) and `clearCompletedAnimation`. Use this to conditionally apply the animation class to the completed bullet.
    - **Particles**: implement as a pure CSS + Tailwind animation — no external library. When `justCompletedStepIndex === index`, render 6–8 small `<span>` elements absolutely positioned at the bullet center. Use `@keyframes` (via a `<style>` tag or a Tailwind `theme()` extension in `index.css`) that translates each particle outward in a different direction and fades opacity 1→0 over 600ms.
    - **Keyframe definition**: add to `app/client/src/index.css`:
      ```css
      @keyframes particle-burst {
        0%   { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
      }
      ```
      Each particle `<span>` sets `--tx` and `--ty` via inline style (e.g. 8 directions: top, top-right, right, bottom-right, bottom, bottom-left, left, top-left at ~16px distance).
    - **Cleanup**: on `onAnimationEnd` of the last particle, call `clearCompletedAnimation()` to reset `justCompletedStepIndex` to null, removing the particle spans.
    - **Bullet pop**: simultaneously apply a `scale-125 → scale-100` pulse to the bullet itself using a short Tailwind `animate-ping`-style class or a dedicated keyframe.

  - `app/client/src/index.css`
    - Add `@keyframes particle-burst` definition
    - Add `@keyframes bullet-pop` for the bullet scale pulse

## Out of scope

- Sound effects
- Any animation on the progress bar fill itself
- Backend / DB changes

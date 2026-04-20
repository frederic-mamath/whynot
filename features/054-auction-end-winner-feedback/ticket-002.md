# Ticket 002 — Particle pop animation for winner inside AuctionEndModal

**Depends on**: ticket-001

## Acceptance Criteria

- As the winning buyer, when the AuctionEndModal opens, I should see a particle burst animation around the trophy icon
- The particles should radiate outward from the trophy icon and fade out within ~600ms
- As a non-winning viewer, I should not see the animation
- The app must build with zero TypeScript errors

## Technical Strategy

### Frontend

- `app/client/src/components/AuctionEndModal/AuctionEndModal.tsx`
  - Add a `PARTICLE_DIRS` constant (8 directions, 16px radius) — identical to the one in `SellerOnboardingPage.tsx`:
    ```typescript
    const PARTICLE_DIRS = [
      { tx: "0px",   ty: "-16px" },
      { tx: "11px",  ty: "-11px" },
      { tx: "16px",  ty: "0px"   },
      { tx: "11px",  ty: "11px"  },
      { tx: "0px",   ty: "16px"  },
      { tx: "-11px", ty: "11px"  },
      { tx: "-16px", ty: "0px"   },
      { tx: "-11px", ty: "-11px" },
    ] as const;
    ```
  - Wrap the `<Trophy>` icon in a `relative` container. When `isWinner && open`, render 8 `<span>` elements absolutely positioned at the icon center, each with inline `--tx` / `--ty` CSS custom properties and `animation: "particle-burst 0.6s ease-out forwards"`.
  - Apply `animation: "bullet-pop 0.4s ease-out"` to the `<Trophy>` icon itself when `isWinner && open`.
  - Use a `useEffect` on `open` to reset animation state (remount particles each time the modal opens).

- `app/client/src/index.css`
  - `@keyframes particle-burst` and `@keyframes bullet-pop` are **already defined** from feature 053. No new CSS needed.

## Out of scope

- Full-screen / background particle overlay
- Sound effects
- Animation on non-winner views

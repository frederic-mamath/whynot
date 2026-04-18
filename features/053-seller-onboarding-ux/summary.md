# Feature 053 — Seller Onboarding UX

## Initial prompt

> On the seller onboarding page, when I start the process to become a seller, there are like 11 steps detailed but I don't see the step's details. I have to scroll down. I want the name of the unrelated steps to be hidden.

## Scope

Redesign the SellerOnboardingPage step list to remove vertical clutter and improve the progress communication:
- Only the active step card is visible (completed + locked rows hidden)
- The progress bar gains 11 bullet points with visual states (completed / active / locked)
- Hover tooltip on desktop, tap tooltip on mobile
- Step completion triggers a particle pop animation on the bullet

## Tickets

| Ticket | Description | Status |
|--------|-------------|--------|
| ticket-001 | Collapse step list + progress bar bullets + tooltips | planned |
| ticket-002 | Particle pop animation on completed bullet | planned |

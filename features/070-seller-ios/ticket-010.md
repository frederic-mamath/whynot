# Ticket 010 — Manual tracking + payout

## Goal

For orders where the buyer did not choose a Mondial Relay point, the seller ships via any carrier and enters the tracking number manually. This requires a new backend mutation to mark the package as shipped with a custom tracking number.

## Acceptance Criteria

- As a seller, when I open a package that does not have a relay point (`hasBuyerRelayPoint: false`) and status is "pending", I see a "Numéro de suivi" text input and a "Marquer comme expédié" button
- As a seller, when I enter a tracking number and tap "Marquer comme expédié", the package status changes to "shipped" and the tracking number is saved
- As a seller, if I submit with an empty tracking number, I see an inline validation error — no server call is made
- After marking as shipped, the package moves from the "À expédier" section to "Expédiés" in the list

## Technical Strategy

- Backend — `app/src/routers/package.ts` (modify)
  - Add new mutation `markShippedManually`:
    ```ts
    markShippedManually: protectedProcedure
      .input(z.object({ packageId: z.string().uuid(), trackingNumber: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const pkg = await packageRepository.findByIdForSeller(input.packageId, ctx.user.id);
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
        if (pkg.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Package already shipped" });
        await packageRepository.markShippedManually(input.packageId, input.trackingNumber);
        return { success: true };
      })
    ```
  - Repository — `app/src/repositories/PackageRepository.ts` (modify)
    - Add `markShippedManually(packageId: string, trackingNumber: string)`:
      - Update `packages` set `tracking_number`, `status = "shipped"`, `updated_at = now()`
      - Update related `orders` set `shipped_at = now()` where `package_id = packageId`

- iOS — `ios-app/app/seller/deliveries/[id].tsx` (modify from ticket 009)
  - Replace "En attente du numéro de suivi" placeholder with actual UI:
    - `TextInput` (placeholder: "Ex: 1Z999AA10123456784") bound to local `trackingNumber` state
    - Validation: `trackingNumber.trim() !== ""`; show inline error if empty on submit
    - "Marquer comme expédié" → `package.markShippedManually.useMutation({ packageId, trackingNumber })` → on success: `utils.package.getPackagesForSeller.invalidate()` → `router.back()`
  - Condition: show this UI when `hasBuyerRelayPoint === false && pkg.status === "pending"`

- Build verification:
  ```bash
  cd app && npm run build:client   # catches backend TypeScript errors
  cd ios-app && npx tsc --noEmit  # catches iOS TypeScript errors
  ```

## Verification

Manual:
1. Open a non-Mondial Relay pending package → see tracking number input
2. Submit empty → inline error shown
3. Enter tracking number → submit → package moves to "Expédiés" with tracking number visible
4. Re-open same package → shows tracking number, status = shipped, refresh + payout buttons appear

## Manual operations to configure services

None.

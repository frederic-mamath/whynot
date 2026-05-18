# ticket-004 — Apple Pay → Google Pay platform split

## Goal

Enable Google Pay on Android while keeping Apple Pay working on iOS, via a `Platform.OS` split in the Stripe configuration. The underlying Stripe `SetupIntent` flow is the same on both platforms — only the payment-sheet UI configuration differs.

## Acceptance Criteria

- As a buyer on Android, in Profile → "Moyen de paiement", when I tap "+ Ajouter une carte", the Stripe payment sheet displays Google Pay as an option alongside manual card entry
- As a buyer on Android, I can complete the card setup via Google Pay and the saved payment method appears in my profile
- As a buyer on iOS, the Apple Pay flow continues to work exactly as before — no regression
- As a developer, `Platform.OS` controls which payment provider config is passed to the Stripe payment sheet
- As a developer, `npx tsc --noEmit` passes; the app builds on both iOS and Android

## Technical Strategy

- iOS App (`ios-app/`)
  - Provider
    - `src/providers/StripeProvider.tsx`
      - Pass `merchantIdentifier` only when `Platform.OS === "ios"` (the iOS-only Apple Pay merchant ID). On Android, omit it — Google Pay does not use this prop.
  - Payment sheet config
    - `src/components/live/PaymentSetupSheet.tsx`
      - In the call to `initPaymentSheet`, add a `googlePay` config block when `Platform.OS === "android"`:

        ```typescript
        googlePay: {
          merchantCountryCode: "FR",
          currencyCode: "EUR",
          testEnv: false,
        }
        ```

      - Keep the existing `applePay` config block for iOS. The two are mutually exclusive based on platform.

## Manual operations

### Verify on Android (S23+)

1. Build and install via `npx expo run:android -d`
2. Log in as a buyer
3. Profile → "+ Ajouter une carte"
4. Confirm the Stripe payment sheet appears with a **Google Pay** button at the top
5. Tap Google Pay → confirm with fingerprint / PIN → verify the card is saved and appears in the profile

### Verify on iOS (no regression)

1. Build via `npx expo run:ios -d` on the iPhone 17e
2. Same flow — confirm Apple Pay still appears and works
3. Check that no warnings appear about a missing `merchantIdentifier` on iOS

### Google Pay prerequisites on the test device

- Google Pay app installed on the S23+ (pre-installed by Samsung)
- A test card added to Google Pay beforehand (Visa/Mastercard)
- Device location set to France or a Google Pay-supported country

## Out of Scope

- Promoting Google Pay above manual card entry visually (Stripe handles ordering)
- Removing Apple Pay on Android (already not displayed because the platform doesn't support it)
- Changing the backend Setup Intent flow — it's identical for both platforms; Stripe abstracts the wallet provider

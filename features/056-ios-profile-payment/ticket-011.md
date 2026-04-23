# ticket-011 — Apple Pay (Save as Card-on-File)

## Acceptance Criteria

- As a buyer on the Profile page, when no payment method is saved, I should see both "Payer avec Apple Pay" and "Ajouter une carte" buttons
- As a buyer, when I tap "Payer avec Apple Pay" and authorise with Face ID / Touch ID, Apple Pay should be saved as my payment method on file
- As a buyer, after saving Apple Pay, the profile should display "Apple Pay" as the saved method
- As a buyer on a device where Apple Pay is not available, the Apple Pay button should not appear

## Technical Strategy

- Frontend
  - `app.config.ts`
    - Update the `@stripe/stripe-react-native` plugin entry to include `merchantIdentifier`:
      ```ts
      ["@stripe/stripe-react-native", { merchantIdentifier: "merchant.fr.mamath.popup" }]
      ```
    - Add `EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID` to `extra` (read from `.env`)
  - `src/components/live/PaymentSetupSheet.tsx` — extend to support Apple Pay
    - Import `useApplePay` from `@stripe/stripe-react-native`
    - Check `isApplePaySupported` — show Apple Pay button only if true
    - Apple Pay save flow:
      1. `createSetupIntent.mutateAsync()` → `{ clientSecret }`
      2. `presentApplePay({ cartItems: [{ label: "Popup", amount: "0.00", paymentType: "Immediate" }], country: "FR", currency: "EUR" })`
      3. `confirmSetupIntent(clientSecret, { paymentMethodType: "ApplePay" })`
      4. On success: call `onSuccess()`
    - Existing card `CardField` flow is unchanged below the Apple Pay button
  - `src/components/OrderCard.tsx` — no change needed (payment sheet handles Apple Pay natively)
  - Run `npx expo prebuild --clean` after `app.config.ts` change, then rebuild with `npx expo run:ios`

## tRPC Procedures

- `payment.createSetupIntent()` → `{ clientSecret }` — already exists, no changes needed

## Manual Operations

### 1. Register Apple Pay Merchant ID (Apple Developer Portal)

1. Go to [developer.apple.com](https://developer.apple.com) → **Certificates, IDs & Profiles** → **Identifiers**
2. Click **+** → select **Merchant IDs** → Continue
3. Enter description: `Popup iOS` and identifier: `merchant.fr.mamath.popup`
4. Click **Register**

### 2. Register the Merchant ID with Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Settings** → **Payment methods** → **Apple Pay**
2. Click **Add new application** → select **iOS app**
3. Enter your Merchant ID: `merchant.fr.mamath.popup`
4. Download the **domain verification file** Stripe provides
5. In the Apple Developer portal → select your Merchant ID → under **Apple Pay Payment Processing Certificate**, click **Create Certificate**
6. Upload the CSR file that Stripe provides during this flow
7. Download the resulting `.cer` certificate and upload it back to the Stripe dashboard to complete verification

### 3. Add Merchant ID to the Xcode project entitlements

After running `npx expo prebuild`, Expo generates the native `ios/` folder. The `@stripe/stripe-react-native` config plugin handles adding the `merchant.fr.mamath.popup` entitlement automatically via the `merchantIdentifier` parameter in `app.config.ts` — no manual Xcode edit needed.

### 4. Add env variable

Add to `ios-app/.env`:
```
EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID=merchant.fr.mamath.popup
```

# ticket-001 — App Icon, Splash Screen & App Store Screenshots

## Acceptance Criteria

- As a developer, when I run a production build, the app displays the real Popup icon (not the Expo placeholder)
- As a developer, when the app launches, the splash screen shows the Popup branding
- As a submitter, I have 5 screenshots in the correct App Store dimensions ready to upload to App Store Connect

## Technical Strategy

### Assets to produce

All asset files live in `ios-app/assets/images/`.

| File | Current state | Required spec |
|:-----|:-------------|:--------------|
| `icon.png` | Expo placeholder | 1024×1024 PNG, RGB (no alpha/transparency), no rounded corners — Apple applies them |
| `splash-icon.png` | Expo placeholder | Your logo/wordmark centered, any size — Expo scales it |

**How Expo uses these files:**
- `icon.png` → Expo generates all required iOS icon sizes (20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt, 1024pt) automatically during `npx expo prebuild`
- `splash-icon.png` → rendered centered on a solid background during app launch. The background color `#ffffff` is set at `ios-app/app.config.ts` line 16 — change it if your splash background should be different (e.g. `#7C3AED` for the purple brand color)

**To verify icons were generated correctly after prebuild:**
```bash
ls ios-app/ios/Popup/Images.xcassets/AppIcon.appiconset/
# You should see multiple PNG files at different sizes
```

### Screenshots

Apple requires screenshots for **iPhone 6.9"** (mandatory). Capture on the iPhone 16 Pro Max simulator, which outputs at the exact required resolution (1320×2868 px) automatically.

**Start the simulator at the correct size:**
```bash
open -a Simulator
# In Simulator menu: File → Open Simulator → iOS 18 → iPhone 16 Pro Max
cd ios-app
npx expo run:ios
```

**5 screens to capture, in this order:**

| # | Screen | How to reach it | What to show |
|:--|:-------|:----------------|:-------------|
| 1 | Home — lives discovery | Launch app, log in | At least 2 live cards visible in the grid |
| 2 | Live page — auction active | Tap a live card during an active auction | Auction widget with countdown + current bid visible |
| 3 | Live page — chat open | Same live, tap the chat input | A few messages visible + keyboard open |
| 4 | Orders tab | Tap Orders in tab bar | At least one order card with status badge |
| 5 | Profile tab | Tap Profile in tab bar | Saved payment method visible (card or Apple Pay) |

**To take a screenshot in Simulator:** `Cmd+S` — saves PNG to Desktop automatically.

**Dimensions Apple requires:**
- iPhone 6.9": 1320×2868 px (the simulator captures at native resolution automatically)
- You can reuse the same 6.9" screenshots for the 6.5" slot — App Store Connect accepts upscaled

**Optional but recommended:** frame screenshots using [Previewed](https://previewed.app) or [AppLaunchpad](https://theapplaunchpad.com) to add a device frame and caption. Not required by Apple, but increases conversion on the store page.

## Manual Operations

None beyond the steps above — all asset work is local file replacement and simulator capture.

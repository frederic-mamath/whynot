# ticket-003 — App Store Connect Setup & Submission

## Acceptance Criteria

- As a submitter, the app listing exists in App Store Connect with name, description, screenshots, and privacy details filled in
- As a submitter, the production build from ticket-002 is attached to the listing and submitted for Apple review
- As a buyer, after Apple approval, the app is publicly downloadable from the App Store

## Manual Operations

This ticket is entirely manual — no code changes.

---

### Step 1 — Create the app in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: `Popup - Live Shopping` (or just `Popup` if available — check availability first)
   - **Primary language**: French
   - **Bundle ID**: `fr.mamath.popup` (select from the dropdown — it appears automatically from your Developer Portal)
   - **SKU**: `popup-ios-v1` (internal reference, never shown publicly)
   - **User access**: Full access
4. Click **Create**
5. Copy the **App ID** (numeric, e.g. `6741234567`) — you'll need it for `eas.json` → `ascAppId` in ticket-002

---

### Step 2 — Fill in app metadata

Navigate to **App Store** tab → **French (France)** localisation (add it if not present).

| Field | Value | Limit |
|:------|:------|:------|
| **Name** | `Popup - Live Shopping` | 30 chars |
| **Subtitle** | `Enchères live & vente flash` | 30 chars |
| **Description** | See template below | 4000 chars |
| **Keywords** | `live,enchères,vente,mode,shopping,auction,stream,achat,direct,popup` | 100 chars |
| **Support URL** | Your support page or `https://popup-live.fr` | — |
| **Privacy Policy URL** | Your existing privacy policy URL | — |

**Description template** (adapt to your brand voice):

```
Popup, c'est le live shopping nouvelle génération.

Rejoins des lives animés par des vendeurs passionnés, 
découvre des produits en exclusivité et participe à des enchères 
en temps réel — le tout depuis ton téléphone.

Comment ça marche :
• Parcours le fil de lives actifs et à venir
• Regarde le vendeur présenter ses produits en direct
• Mise sur les articles qui t'intéressent pendant les enchères
• Paie en toute sécurité avec ta carte ou Apple Pay
• Suis l'état de tes commandes en temps réel

Popup, c'est vendre et acheter autrement.
```

---

### Step 3 — Upload screenshots

In the **iPhone 6.9"** section, upload the 5 screenshots captured in ticket-001 in this order:
1. Lives discovery (home)
2. Auction widget active
3. Chat open during live
4. Orders tab
5. Profile with payment method

Drag to reorder. The first screenshot is the one shown in search results.

---

### Step 4 — App information & rating

Navigate to **General** → **App Information**:
- **Category**: Shopping (primary)
- **Secondary category**: Entertainment

Navigate to **General** → **Age Rating** → **Edit**:
- Answer all questions. For Popup:
  - Gambling or contests: **No**
  - In-app purchases: **Yes** (Stripe payments)
  - Everything else: No
- Result will be **4+**

---

### Step 5 — Pricing

Navigate to **Pricing and Availability**:
- **Price**: Free
- **Availability**: All territories (or restrict to France only for soft launch)

---

### Step 6 — Privacy questionnaire (App Privacy)

Navigate to **App Privacy** → **Get Started**. Popup collects:

| Data type | Collected | Linked to user | Used for tracking |
|:----------|:----------|:---------------|:------------------|
| Email address | Yes | Yes | No |
| Name | Yes | Yes | No |
| Payment info | Yes | Yes | No |
| Purchase history | Yes | Yes | No |

For each: select **Data Used to Provide App Functionality** as the purpose.

---

### Step 7 — Attach the build and submit

1. Navigate to the version page (e.g. **1.0 Prepare for Submission**)
2. Under **Build**, click **+** → select the build produced by ticket-002 (it appears after EAS uploads it — may take a few minutes to process)
3. Fill in **What's New** (for version 1.0, this can be left blank or: `Première version de Popup.`)
4. Fill in **Review Information**:
   - **Sign-in required**: Yes
   - **Demo account**: create a test buyer account and enter its email + password here so Apple's reviewers can log in
   - **Notes**: `This is a buyer-only app. Video streaming requires an active live session hosted by a seller. To test bidding and payment, a live session must be in progress.`
5. Click **Add for Review** → **Submit to App Review**

---

### Step 8 — Monitor review

Apple's first review averages 1–3 business days. You'll receive an email at the address on your Apple Developer account.

If rejected:
- Read the rejection reason carefully — it's almost always fixable
- Common first-submission rejections: missing demo account credentials, privacy policy URL not loading, crash on reviewer's device
- Reply directly in App Store Connect Resolution Center without resubmitting the build unless there's a code fix needed

---

### After approval

The app goes **live immediately** unless you chose "Manual Release" in pricing. If you want to control the release date, go back to the version page before submitting and select **Manually release this version**.

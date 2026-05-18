# ticket-005 — Google Play Console account + first listing

## Goal

Create the Google Play Developer account (one-time $25 fee), set up the app entry for "Popup", and fill all required metadata so the listing is ready to accept a binary upload in ticket-006. No code work.

## Acceptance Criteria

- As a developer, a Google Play Developer account is created and verified under FREDERIC KHUU THANH MAMATH
- As a developer, an app entry exists in Play Console for `fr.mamath.popup` named "Popup"
- As a developer, all required forms in **App content** are completed: Privacy policy, Ads, App access, Content rating, Target audience, Data safety
- As a developer, the **Main store listing** has the icon, feature graphic, phone screenshots, short description, and full description in French
- As a developer, the app is in **Draft** state — ready to accept a binary upload in the next ticket

## Technical Strategy

No code work. This is a manual operations ticket.

## Manual operations

### 1. Create the developer account

1. Go to **https://play.google.com/console/u/0/signup**
2. Sign in with `fredericmamath@gmail.com` (same email as Apple Developer for consistency)
3. Select **Personal account** (or Organization if you have an SIRET — Personal is simpler for now)
4. Pay the **one-time $25 USD** registration fee via credit card
5. Verify identity via a government-issued ID (passport or carte d'identité — process can take 24–48h)

### 2. Create the app entry

Once verified, in Play Console → **Create app**:

| Field | Value |
| :--- | :--- |
| App name | Popup |
| Default language | French (France) – fr-FR |
| App or game | App |
| Free or paid | Free |
| Declarations | Check both: Developer Program Policies, US export laws |

Click **Create app**.

### 3. Fill the App content section (left sidebar → App content)

Each form must be completed before submission. Provide:

- **Privacy policy URL**: `https://popup-live.fr/privacy` (the same URL used for iOS)
- **App access**: select "Toutes les fonctionnalités sont disponibles sans restriction d'accès spécifique" if buyer-only; if a login is needed for the review, provide a demo account (same credentials as iOS demo account)
- **Ads**: "Mon application ne contient pas d'annonces"
- **Content rating**: complete the IARC questionnaire. Likely outcome: **PEGI 3** (commerce app, no violence, no adult content)
- **Target audience and content**: select age range **18+** (matches iOS target audience for commerce / payments)
- **News app**: No
- **COVID-19 contact tracing**: No
- **Data safety**: declare the same data points as the iOS Privacy Nutrition Labels — at minimum: email, name, purchase history, app interaction data. Mark all as collected, encrypted in transit, used for app functionality

### 4. Fill the Main store listing (left sidebar → Main store listing)

| Asset | Spec | Notes |
| :--- | :--- | :--- |
| App icon | 512×512 PNG, 1 MB max | Reuse iOS icon (`assets/images/icon.png` scaled if needed) |
| Feature graphic | 1024×500 PNG/JPG, 15 MB max | New asset — Play-only |
| Phone screenshots | 16:9 or 9:16, min 320 px, max 3840 px, 2–8 required | Capture from S23+ after binary install in ticket-006 |
| Short description | 80 chars max | "Live shopping en direct — enchères, ventes éclair, achats en quelques minutes." |
| Full description | 4000 chars max | Translate the App Store description |

The screenshots step can be done in ticket-006 after the binary is installed on the S23+ — until then, leave the screenshots field empty (the listing can stay in Draft).

### 5. Verify

In Play Console → app dashboard, you should see all checklist items in App content marked complete (except possibly the screenshots if deferred). The app remains in **Draft** until a binary is uploaded and the release is submitted.

## Out of Scope

- Binary upload (ticket-006)
- Production release (ticket-006)
- Translation to additional languages beyond French
- App promotion / marketing assets beyond the required minimum

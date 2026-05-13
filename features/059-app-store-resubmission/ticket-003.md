# ticket-003 — Record demo videos, fill Review Notes, resubmit

## Acceptance Criteria

- As a submitter, a screen recording of the account deletion flow on a physical iPhone is hosted online and its link is in the Review Notes field
- As a submitter, a screen recording of the Apple Pay card addition flow on a physical iPhone is hosted online and its link is in the Review Notes field
- As a submitter, the 1.0.1 build is attached to the version and submitted for Apple review

## Manual Operations

### Before you start

Enable screen recording on your iPhone if not already done:
**Réglages → Centre de contrôle → ajouter "Enregistrement d'écran"**

Use a physical iPhone connected to production (`https://popup-live.fr`). Both videos must show a real device status bar (time, signal, battery) — not a simulator.

---

### Video 1 — Account deletion (for guideline 5.1.1)

**Apple's requirement**: show creating/signing in, navigating to deletion, and the complete flow to confirmation.

**Setup**: Use a fresh buyer account that you can permanently delete on camera. Create it at `https://popup-live.fr` or in the app beforehand, and make sure it has no pending orders (otherwise the blocker screen will appear — which is fine to show, but you'll need a second account with no orders for the actual deletion).

**Flow to record**:
1. Start screen recording (Control Centre → record button → 3-second countdown)
2. Open Popup Live on device → log in with the demo account
3. Tap **Profil** tab at the bottom
4. Scroll to the bottom → tap **"Supprimer mon compte"** (red button)
5. Confirm in the native alert → **"Supprimer définitivement"**
6. App navigates to login screen — show this final state
7. Stop recording (tap red bar at top of screen)

**Duration target**: under 90 seconds.

---

### Video 2 — Apple Pay card addition (for guideline 2.1)

**Apple's requirement**: show all Apple Pay functionality, specifically a new card being added to Wallet on a physical device.

**Setup**: Use a buyer account with **no saved payment method**. Have a real card ready to enter (Visa or Mastercard). Make sure your iPhone has Face ID or passcode set up (required for Apple Pay).

**Flow to record**:
1. Start screen recording
2. Open Popup Live → log in
3. Tap **Profil** tab
4. In the **"Moyen de paiement"** section → tap **"+ Ajouter une carte"**
5. The Stripe card sheet appears — enter card number, expiry, CVC
6. Confirm → card is saved — show the confirmation state displaying the card brand and last 4 digits
7. Stop recording

**Duration target**: under 60 seconds.

---

### Upload the videos

1. Upload both `.mov` files to Google Drive or Dropbox
2. Set sharing to "Anyone with the link can view"
3. Copy each link

---

### Fill in Review Notes in App Store Connect

1. Go to App Store Connect → **Popup Live** → **Distribution** → version **1.0.1**
2. Scroll to **"Informations de révision de l'app"** → **"Notes"** field
3. Paste the following, replacing the placeholder URLs:

```
Suppression de compte (directive 5.1.1.v) :
La suppression de compte est disponible dans l'onglet Profil, en bas de l'écran (bouton rouge "Supprimer mon compte").
Vidéo de démonstration : [LIEN_VIDEO_SUPPRESSION]

Apple Pay (directive 2.1) :
La fonctionnalité Apple Pay est accessible dans l'onglet Profil → Moyen de paiement → "+ Ajouter une carte".
Vidéo de démonstration : [LIEN_VIDEO_APPLE_PAY]

Note générale : L'application est réservée aux acheteurs. Le streaming vidéo nécessite une session live active hébergée par un vendeur. Pour tester les enchères, une session doit être en cours.
```

4. Under **"Compte de démonstration"**: enter the email and password of a test buyer account that still exists (not the one you deleted in the video)

---

### Attach the 1.0.1 build and resubmit

1. On the version page, under **"Build"** → click **"+"** → select the 1.0.1 build uploaded in ticket-002 (it appears once Apple finishes processing — may take up to 30 minutes)
2. Verify all sections are filled: screenshots, description, privacy labels, review notes, demo account
3. Click **"Ajouter à la révision"** → **"Soumettre à la révision Apple"**

---

### Wait condition

Only resubmit after you have either received a reply from Apple resolving the 4.1 issue (ticket-001), or 5 business days have passed without a reply. Apple cannot review the new submission until the current rejection state is cleared.

# ticket-003 — iOS: delete account UI in profile screen

## Acceptance Criteria

- As a buyer, in the iOS profile screen, I see a "Supprimer mon compte" button at the bottom of the screen
- As a buyer, when I tap it, a native iOS confirmation alert appears warning me the action is irreversible
- As a buyer, when I confirm, my account is deleted, I am logged out, and I am returned to the welcome screen
- As a buyer, when I cancel the alert, nothing happens
- As a buyer, while deletion is in progress, the button is disabled and shows a loading indicator

## Technical Strategy

### Frontend — iOS
- **Screen** — `ios-app/app/(tabs)/profile.tsx`
  - Add `deleteAccountMutation = trpc.auth.deleteAccount.useMutation()` near the existing `logoutMutation`
  - Add `handleDeleteAccount`:
    ```typescript
    const handleDeleteAccount = () => {
      Alert.alert(
        "Supprimer mon compte",
        "Cette action est irréversible. Toutes tes données seront supprimées définitivement.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteAccountMutation.mutateAsync();
                await logout();
              } catch {
                Alert.alert("Erreur", "Une erreur est survenue. Réessaie plus tard.");
              }
            },
          },
        ]
      );
    };
    ```
  - `logout()` from `useAuth()` clears the token and redirects to the auth flow — no additional navigation needed
  - Add the button at the bottom of the profile scroll view, below the existing logout button, with `color="red"` / destructive style and `disabled={deleteAccountMutation.isPending}`

## Manual Operations

### App Store Connect — Reviewer notes update (feature 057 ticket-003)

After this ticket ships, update the **Notes for reviewer** in App Store Connect to mention account deletion:

> This is a buyer-only app. Sellers onboard via the web app (popup-live.fr).
> Video streaming requires an active live session; the home feed may appear empty during review.
> To test account deletion: go to Profile tab → scroll to the bottom → tap "Supprimer mon compte".
> Demo account: [email] / [password]

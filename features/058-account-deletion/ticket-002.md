# ticket-002 — Web: delete account UI in ProfilePage

## Acceptance Criteria

- As a buyer, in the ProfilePage, I see a "Supprimer mon compte" button in a clearly separated danger zone section
- As a buyer, when I click the button, a confirmation dialog appears warning me the action is irreversible
- As a buyer, when I confirm, my account is deleted, I am logged out, and I am redirected to `/`
- As a buyer, when I dismiss the dialog, nothing happens
- As a buyer, while the deletion is in progress, the confirm button shows a loading state and is disabled

## Technical Strategy

### Frontend
- **Hooks** — `app/client/src/pages/ProfilePage/ProfilePage.hooks.ts`
  - Add `deleteAccountMutation = trpc.auth.deleteAccount.useMutation()`
  - Add `handleDeleteAccount` handler:
    1. Call `deleteAccountMutation.mutateAsync()`
    2. On success: call `removeToken()` then `navigate("/")`
    3. On error: `toast.error("Une erreur est survenue. Réessaie plus tard.")`
  - Return `{ deleteAccountMutation, handleDeleteAccount }` from the hook

- **View** — `app/client/src/pages/ProfilePage/ProfilePage.tsx`
  - Add a danger zone `<section>` at the bottom of the page, visually separated with a top border
  - Use the existing `AlertDialog` component from `components/ui/alertdialog`:
    ```
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Supprimer mon compte</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Supprimer mon compte</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action est irréversible. Toutes tes données seront supprimées définitivement.
        </AlertDialogDescription>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction
          onClick={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
        >
          {deleteAccountMutation.isPending ? "Suppression…" : "Supprimer définitivement"}
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
    ```

## Manual Operations

None.

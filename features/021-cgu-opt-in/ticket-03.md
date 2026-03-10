# Ticket 03 — Section opt-in CGU dans SignUpPage

## Acceptance Criteria

- En tant qu'utilisateur, dans la page `/register`, quand je n'ai pas coché la case CGU, le bouton "Créer mon compte" est désactivé (`disabled`).
- En tant qu'utilisateur, quand je coche la case et que tous les autres champs sont valides, le bouton se débloque.
- En tant qu'utilisateur, en cliquant sur "Conditions Générales d'Utilisation" dans la section opt-in, je suis redirigé vers `/cgu`.
- En tant qu'utilisateur, en cliquant sur "Politique de Confidentialité" dans la section opt-in, je suis redirigé vers `/politique-de-confidentialite`.
- En tant qu'utilisateur, la section opt-in s'affiche dans un card arrondi avec une bordure (`rounded-xl border border-border`), fidèle au screenshot.
- En tant que développeur, le champ `acceptedCgu: true` est envoyé dans le payload `registerMutation.mutate()`.

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/SignUpPage/SignUpPage.tsx`
      - Import : Ajoute `import { Checkbox } from "@/components/ui/checkbox"`.
      - State : Ajoute `const [acceptedCgu, setAcceptedCgu] = useState(false)`.
      - `isFormValid` : Étend la condition pour inclure `&& acceptedCgu`.
      - `handleSubmit` : Passe `acceptedCgu: true` dans `registerMutation.mutate({ nickname, email, password, acceptedCgu: true })`.
      - Bloc JSX : Insère entre le champ mot de passe et le bouton submit :
        ```tsx
        <div className="rounded-xl border border-border p-4 mb-4 flex gap-3 items-start">
          <Checkbox
            id="cgu"
            checked={acceptedCgu}
            onCheckedChange={(checked) => setAcceptedCgu(checked === true)}
            className="mt-0.5 shrink-0"
          />
          <label
            htmlFor="cgu"
            className="font-outfit text-foreground text-[13px] leading-[20px] cursor-pointer"
          >
            J'accepte les{" "}
            <Link
              to="/cgu"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              Conditions Générales d'Utilisation
            </Link>{" "}
            et la{" "}
            <Link
              to="/politique-de-confidentialite"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              Politique de Confidentialité
            </Link>{" "}
            de Popup.
          </label>
        </div>
        ```
      - `ButtonV2` : `disabled={!isFormValid || registerMutation.isPending}`, label dynamique `"Création..."` pendant l'envoi.

## Manual operations

Aucune.

## Status

completed

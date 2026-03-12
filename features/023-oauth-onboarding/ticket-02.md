# Ticket 02 — Router tRPC : profile.me + completeOnboarding

## Acceptance Criteria

- En tant que développeur, `trpc.profile.me` retourne désormais `nickname`, `avatarUrl` et `hasCompletedOnboarding` en plus des champs existants.
- En tant que développeur, `trpc.profile.completeOnboarding` accepte un `nickname` (1–50 chars, alphanumérique + `_.-`) et un `avatarUrl` optionnel.
- En tant que développeur, si le pseudo est déjà pris par un autre utilisateur, la mutation lève une `TRPCError` avec le code `CONFLICT` et le message "Ce pseudo est déjà pris".
- En tant que développeur, après un appel réussi, `has_completed_onboarding` est mis à `true` en base de données.

## Technical Strategy

- Backend
  - Router
    - `app/src/routers/profile.ts`
      - `profile.me`: Exposer `nickname: user.nickname`, `avatarUrl: user.avatar_url || null`, `hasCompletedOnboarding: user.has_completed_onboarding`.
      - `profile.completeOnboarding` _(nouvelle mutation)_: `protectedProcedure`. Input : `{ nickname: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_.-]+$/), avatarUrl?: z.string().url() }`. Vérification unicité via `userRepository.findByNickname()` (erreur si `existing.id !== ctx.user.id`). Appel `userRepository.updateProfile({ nickname, avatar_url, has_completed_onboarding: true })`. Retourne `{ success: true }`.

## Manual operations

Aucune.

## Status

completed

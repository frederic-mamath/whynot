# Ticket 003 — Frontend: avatar in BottomNav

## Acceptance Criteria

- As a user, in the BottomNav, when I have an avatar, I should see my avatar photo (circular) instead of the `<User />` icon on the "Profil" tab
- As a user, in the BottomNav, when I have no avatar or while loading, I should see the default `<User />` icon

## Technical Strategy

- Frontend
  - Component
    - `app/client/src/components/BottomNav/BottomNav.tsx`
      - Add `trpc.profile.me.useQuery()` to fetch current user
      - On the "Profil" nav item: replace static `<User className="w-5 h-5" />` with conditional render:
        - If `profile.avatarUrl` → `<img src={profile.avatarUrl} className="w-5 h-5 rounded-full object-cover" />`
        - Else → `<User className="w-5 h-5" />`

## Manual operations to configure services

- None

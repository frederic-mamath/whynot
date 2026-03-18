# Feature 035 — Navigation & Auth UX

## Progress

| User Story                                                                                                                                                            | Status |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| As an authenticated user, in the profile page, when I log out, trpc.profile.me is invalidated and the full query cache is reset so the BottomNav becomes hidden       | done   |
| As an authenticated user, when I navigate to /login or /register, I am redirected to /home                                                                            | done   |
| As any user, the BottomNav items are ordered: Home, Lives, Vendre, Activité, Profil                                                                                   | done   |
| As a buyer (without SELLER role), when I click "Vendre" in the BottomNav, I see a page explaining the benefits of selling on Popup with a "Commencer à vendre" button | done   |
| As a buyer, when I click "Commencer à vendre", my seller role request is submitted and awaits admin approval                                                          | done   |
| As a seller, when I click "Vendre" in the BottomNav, I'm redirected to /seller/lives                                                                                  | done   |

## Initial Prompt

> As an authenticated user, in the profile page, when I log out, I want trpc.profile.me to be invalidated so the bottom navbar becomes hidden. The signin & signup pages shouldn't be accessible when the user is authenticated. If he tries to access these pages, he will be redirected to "/home".
>
> You will update the BottomNav items' order to: Home, Lives, Vendre, Activité, Profil.
>
> As a buyer, in the bottom navbar, when I click on "Vendre" and that I don't have the "seller" role, I see a page explaining what's the benefits of selling on Popup.
> "Get Started" is translated to "Commencer à vendre" and triggers a request to become a seller. The database admin validates the role.

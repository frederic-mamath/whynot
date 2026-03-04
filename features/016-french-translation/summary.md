# Feature 016 — Traduction de l'interface web en français

## Overview

Mettre en place i18next dans l'app web et traduire tous les textes utilisateur en français. Le code reste inchangé, seuls les textes visibles (labels, titres, descriptions, boutons, placeholders, erreurs, toasts) passent en FR.

## User Stories

| User Story                                                                            | Status  |
| :------------------------------------------------------------------------------------ | :------ |
| As a user, in all pages, I see all text in French                                     | planned |
| As a user, in all dialogs and components, I see all text in French                    | planned |
| As a developer, I have an i18n setup that supports adding new languages in the future | planned |

## Tickets

| Ticket                      | Description                                                       | Status  |
| :-------------------------- | :---------------------------------------------------------------- | :------ |
| [ticket-01](./ticket-01.md) | Setup i18next infrastructure + Landing & Auth pages               | planned |
| [ticket-02](./ticket-02.md) | Dashboard, Profile, NavBar                                        | planned |
| [ticket-03](./ticket-03.md) | Channel pages + Channel components (controls, participants, chat) | planned |
| [ticket-04](./ticket-04.md) | Shop, Product, Vendor pages + components                          | planned |
| [ticket-05](./ticket-05.md) | Auction components + Payment dialogs + Orders + remaining         | planned |

## Architecture Decisions

- **i18next + react-i18next** : bibliothèque standard, légère, écosystème riche. Pas besoin de i18next-http-backend pour l'instant (fichier JSON statique embarqué dans le bundle).
- **Namespace unique** `translation` pour commencer (un seul fichier `fr.json`). Découpage en namespaces par page si le fichier grossit trop.
- **Clés structurées** par page/composant : `landing.hero.title`, `login.form.email`, `navbar.menu.profile`, etc.
- **Langue par défaut FR** — pas de fallback EN pour la v1. L'anglais pourra être ajouté plus tard avec un fichier `en.json`.
- **Toast et erreurs** inclus dans la traduction (les messages d'erreur serveur restent en EN côté API, mais les messages affichés à l'utilisateur sont en FR).

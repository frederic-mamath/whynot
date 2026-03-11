# Feature 022 — Renommage Channel → Live + SellerLivePage

## Objectif

Refactoriser l'ensemble du projet pour remplacer la terminologie "channel" par "live" (plus proche du vocabulaire métier), et créer une `SellerLivePage` fonctionnelle avec deux onglets : **Programme** (lives planifiés et passés) et **+Live** (formulaire de planification).

## Prompt initial

/plan The feature "channel" needs to be refactored.

The naming should become "live".

Users with the role "seller" can program lives. Each live has a starting datetime and and ending datetime. When a session has started, the user should have the possibility to end the session earlier if he wants. If this happens, we should have a "session_stopped_at" attribute set.

The migration should rename the table "channels" into "lives". When running the migration, you will verify that there is no errors or you will fix them.

I've attached a screenshot so you can learn what needs to be visible in the tab to create a live.

You can get inspired by the SellerShopPage. The new page should be named "SellerLivePage". It will contains 2 tabs: "Program" and "+ Live".

In the Program tab, you should see two sessions: "Next live" and "History".

In the section "Next live", we should see the incoming live with the closest start datetime. If there is no live corresponding to this criterion, there will be a button saying "Programme ton prochain live".

In the section "History", you will display the list of "lives" ordered by start datetime descending. For each live in the past, you will add a "Terminé" on top of the live card.

Do you have any questions ?

In the feature summary.md, you will store this initial prompt.

## Statut des tickets

| User Story                                                                                                                                                                                   | Ticket    | Status    |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- | :-------- |
| En tant que développeur, quand je lance la migration 031, les tables `channels`, `channel_participants`, `channel_products` sont renommées en `lives`, `live_participants`, `live_products`. | ticket-01 | completed |
| En tant que développeur, les types Kysely et les repositories reflètent les nouveaux noms de tables.                                                                                         | ticket-01 | completed |
| En tant que vendeur, via le routeur tRPC `live.schedule`, je peux planifier un live avec un nom, une description, une date et une heure.                                                     | ticket-02 | completed |
| En tant que vendeur, via le routeur tRPC `live.start`, je peux démarrer un live planifié et recevoir un token Agora.                                                                         | ticket-02 | completed |
| En tant que vendeur, via le routeur tRPC `live.listByHost`, je vois mes lives à venir et passés.                                                                                             | ticket-02 | completed |
| En tant que vendeur, dans la page "Lives" (onglet Programme), je vois mes prochains lives planifiés et mon historique.                                                                       | ticket-03 | completed |
| En tant que vendeur, dans la page "Lives" (onglet +Live), je peux planifier un nouveau live avec un formulaire.                                                                              | ticket-03 | completed |
| En tant qu'utilisateur, tous les appels tRPC frontend utilisent `trpc.live.*` au lieu de `trpc.channel.*`.                                                                                   | ticket-04 | completed |
| En tant que développeur, les routes frontend `/live/:id` et `/lives` remplacent `/channel/:id` et `/channels`.                                                                               | ticket-04 | completed |

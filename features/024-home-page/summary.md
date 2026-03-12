# Feature 024 — HomePage : Liste des vendeurs

## Objectif

Créer une page d'accueil `/home` commune à tous les utilisateurs authentifiés ayant complété leur onboarding. La page affiche la liste de tous les SELLER possédant une boutique, avec leur avatar (ou initiale), leur pseudo et leurs 3 catégories de produits les plus fréquentes.

## Prompt initial

Follow instructions in plan.prompt.md.
As a any authenticated users that has finished his onboarding, when I sign in, I want to land on the HomePage. To clarify, the home page should be the same wether you are a BUYER or a SELLER.

For now, you will see the list of all the SELLER. Each SELLER will be displayed in a card. On the left of the card, you will see his avatar or the first letter of his nickname. Just next to it on the right, you will see his nickname. Bellow the nickname, you will see the top 3 most frequent product's category that he has in his shop.

When starting the implementation, you will create the documentation according to features/ARCHITECTURE.md.

Do you have any questions ?

## Statut des tickets

| User Story                                                                                                                 | Ticket    | Status    |
| :------------------------------------------------------------------------------------------------------------------------- | :-------- | :-------- |
| En tant que développeur, `trpc.shop.listSellers` retourne la liste des shop owners avec leurs top 3 catégories.            | ticket-01 | completed |
| En tant qu'utilisateur authentifié post-onboarding, quand je me connecte via OAuth, j'arrive sur `/home`.                  | ticket-02 | completed |
| En tant qu'utilisateur authentifié, sur `/home`, je vois la liste des vendeurs avec avatar/initiale, pseudo et catégories. | ticket-02 | completed |
| En tant qu'utilisateur, le bouton "Home" de la BottomNav pointe vers `/home`.                                              | ticket-02 | completed |
| En tant qu'utilisateur finissant l'onboarding, je suis redirigé vers `/home` après avoir validé mon pseudo.                | ticket-02 | completed |

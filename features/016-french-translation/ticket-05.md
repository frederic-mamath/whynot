# Ticket 05 — Auction, Payment, Orders & remaining components

## Acceptance Criteria

- As a user, all auction components (AuctionWidget, AuctionConfigModal, AuctionEndModal, BidInput, BidHistory, AuctionCountdown) display text in French
- As a user, payment dialogs (PaymentSetupDialog, PaymentRequiredDialog) display consistently in French
- As a user, the My Orders page and OrderCard display in French ("Mes commandes", "En attente", "Payée")
- As a user, all remaining utility components (ErrorBoundary, ProtectedRoute, ImageUploader, etc.) display in French
- As a developer, all hardcoded strings in the codebase are replaced by `t()` calls — no remaining English text

## Technical Strategy

- Frontend
  - Locales
    - `app/client/src/locales/fr.json`
      - Ajouter les namespaces : `auction`, `payment`, `orders`, `errors`, `common`
  - Components — Auction
    - `app/client/src/components/AuctionWidget/AuctionWidget.tsx`
      - Remplacer ~12 chaînes : titre, état, prix, boutons
    - `app/client/src/components/AuctionConfigModal/AuctionConfigModal.tsx`
      - Remplacer ~10 chaînes : titre modal, labels des champs, boutons démarrer/annuler
    - `app/client/src/components/AuctionEndModal/AuctionEndModal.tsx`
      - Remplacer ~10 chaînes : titre, résultats, bouton fermer
    - `app/client/src/components/BidInput/BidInput.tsx`
      - Remplacer ~5 chaînes : placeholder, bouton enchérir, messages de validation
    - `app/client/src/components/BidHistory/BidHistory.tsx`
      - Remplacer ~4 chaînes : titre, format d'enchère
    - `app/client/src/components/AuctionCountdown/AuctionCountdown.tsx`
      - Remplacer ~1 chaîne : label temps restant
  - Components — Products en live
    - `app/client/src/components/HighlightedProduct/HighlightedProduct.tsx`
      - Remplacer ~4 chaînes : titre, prix, actions
    - `app/client/src/components/PromotedProducts/PromotedProducts.tsx`
      - Remplacer ~8 chaînes : titre, cartes, actions, état vide
  - Components — Payment
    - `app/client/src/components/PaymentSetupDialog/PaymentSetupDialog.tsx`
      - Harmoniser les chaînes restantes en FR (la plupart sont déjà traduites)
    - `app/client/src/components/PaymentRequiredDialog/PaymentRequiredDialog.tsx`
      - Harmoniser via `t()` les chaînes déjà traduites
    - `app/client/src/components/PaymentDeadlineCountdown/PaymentDeadlineCountdown.tsx`
      - Remplacer ~2 chaînes : délai de paiement
  - Pages — Orders
    - `app/client/src/pages/MyOrdersPage.tsx`
      - Remplacer ~18 chaînes : titre, filtres, états, messages
    - `app/client/src/components/OrderCard/OrderCard.tsx`
      - Remplacer ~14 chaînes : statuts, labels, prix, boutons
  - Components — Utilitaires
    - `app/client/src/components/ErrorBoundary/ErrorBoundary.tsx`
      - Remplacer ~6 chaînes : titre erreur, message, bouton réessayer
    - `app/client/src/components/ProtectedRoute/ProtectedRoute.tsx`
      - Remplacer ~4 chaînes : messages de redirection
    - `app/client/src/components/ImageUploader/ImageUploader.tsx`
      - Remplacer ~10 chaînes : labels, placeholder, erreurs de taille/format
    - `app/client/src/components/NetworkQuality/NetworkQuality.tsx`
      - Remplacer ~6 chaînes : indicateurs de qualité réseau

## Validation finale

- Grep pour vérifier qu'il ne reste aucune chaîne EN hardcodée dans `client/src/`
- Tester navigation complète de l'app (landing → login → dashboard → chaîne → enchère → commandes)

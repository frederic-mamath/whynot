# Ticket 04 — Shop, Product & Vendor pages + components

## Acceptance Criteria

- As a user, in the Shop pages, I see all text in French ("Boutiques", "Créer une boutique", "Détails de la boutique")
- As a user, in the Product pages, I see all text in French ("Produits", "Ajouter un produit", "Modifier le produit")
- As a user, all vendor-related components (VendorList, AddVendorModal, AssociateProductModal, ProductCard) are in French

## Technical Strategy

- Frontend
  - Locales
    - `app/client/src/locales/fr.json`
      - Ajouter les namespaces : `shops`, `products`, `vendors`
  - Pages
    - `app/client/src/pages/ShopListPage.tsx`
      - Remplacer ~8 chaînes : titre, bouton créer, cartes, état vide
    - `app/client/src/pages/ShopCreatePage.tsx`
      - Remplacer ~8 chaînes : titre, labels des champs, validation, bouton
    - `app/client/src/pages/ShopDetailsPage.tsx`
      - Remplacer ~14 chaînes : titre, sections vendeurs/produits, boutons, badges
    - `app/client/src/pages/ProductListPage.tsx`
      - Remplacer ~10 chaînes : titre, filtres, cartes produit, état vide
    - `app/client/src/pages/ProductCreatePage.tsx`
      - Remplacer ~12 chaînes : titre, labels des champs, sélecteurs, validation, bouton
    - `app/client/src/pages/ProductUpdatePage.tsx`
      - Remplacer ~16 chaînes : titre, labels des champs, sélecteurs, validation, boutons supprimer/sauvegarder
  - Components
    - `app/client/src/components/VendorList/VendorList.tsx`
      - Remplacer ~5 chaînes : titre, rôles, bouton ajouter
    - `app/client/src/components/AddVendorModal/AddVendorModal.tsx`
      - Remplacer ~7 chaînes : titre, recherche, bouton ajouter, état vide
    - `app/client/src/components/AssociateProductModal/AssociateProductModal.tsx`
      - Remplacer ~10 chaînes : titre, recherche, produits, bouton associer
    - `app/client/src/components/ProductCard/ProductCard.tsx`
      - Remplacer ~3 chaînes : labels prix, statut, actions

# Ticket 03 — Channel pages & components

## Acceptance Criteria

- As a user, in the Channel List page, I see all text in French ("Chaînes en direct", "Créer une chaîne", "Aucune chaîne disponible")
- As a user, in the Channel Create page, I see all text in French ("Nouvelle chaîne", "Nom de la chaîne", "Créer")
- As a user, in the Channel Details page, I see all text in French ("En direct", "Participants", chat, contrôles)
- As a user, all channel-related components (ChatPanel, ParticipantList, ChannelControls, etc.) are in French

## Technical Strategy

- Frontend
  - Locales
    - `app/client/src/locales/fr.json`
      - Ajouter les namespaces : `channels`, `chat`, `participants`
  - Pages
    - `app/client/src/pages/ChannelListPage.tsx`
      - Remplacer ~14 chaînes : titre, filtres, cartes de chaîne, états vides, boutons
    - `app/client/src/pages/ChannelCreatePage.tsx`
      - Remplacer ~14 chaînes : titre, labels des champs, validation, boutons
    - `app/client/src/pages/ChannelDetailsPage.tsx`
      - Remplacer ~18 chaînes : titre, statut, contrôles, tabs, états d'erreur
  - Components
    - `app/client/src/components/ChatPanel/ChatPanel.tsx`
      - Remplacer ~12 chaînes : titre, placeholder, bouton envoyer, timestamps
    - `app/client/src/components/ParticipantList/ParticipantList.tsx`
      - Remplacer ~7 chaînes : titre, rôles, badges
    - `app/client/src/components/ChannelControls/ChannelControls.tsx`
      - Remplacer ~6 chaînes : boutons micro/caméra, quitter, terminer
    - `app/client/src/components/VerticalControlPanel/VerticalControlPanel.tsx`
      - Remplacer ~5 chaînes : boutons verticaux
    - `app/client/src/components/MessageList/MessageList.tsx`
      - Remplacer ~2 chaînes : état vide
    - `app/client/src/components/MessageInput/MessageInput.tsx`
      - Remplacer ~1 chaîne : placeholder
    - `app/client/src/components/RoleBadge/RoleBadge.tsx`
      - Remplacer ~2 chaînes : labels vendeur/acheteur

# WhyNot — Mobile App

Application mobile React Native pour la plateforme de live commerce **WhyNot**.  
Construite avec **Expo SDK 55**, consomme le backend tRPC existant.

## Stack technique

| Couche     | Technologie                         |
| ---------- | ----------------------------------- |
| Framework  | Expo SDK 55 / React Native 0.83     |
| Navigation | Expo Router ~55 (file-based)        |
| Styling    | react-native-unistyles v3           |
| API        | tRPC v11 + @tanstack/react-query v5 |
| Auth       | JWT (expo-secure-store)             |
| Vidéo live | Agora RTC SDK (react-native-agora)  |
| Paiements  | Stripe (PaymentSheet)               |
| Images     | expo-image-picker → Cloudinary      |
| Réseau     | @react-native-community/netinfo     |
| Icônes     | lucide-react-native                 |

## Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Expo CLI** : `npm install -g expo-cli` (ou utilisez `npx expo`)
- **EAS CLI** (pour le build) : `npm install -g eas-cli`
- Un appareil physique ou émulateur (les SDK Agora et Stripe nécessitent un **dev client** natif)

## Installation

```bash
cd mobile-app
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` est nécessaire car certains packages ne supportent pas encore React 19 en peer.

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine de `mobile-app/` (optionnel — les valeurs par défaut sont dans `app.json > extra`) :

```env
# URL de l'API backend
API_URL=https://whynot-app.onrender.com

# Clé publique Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Agora App ID (provisionné côté serveur)
AGORA_APP_ID=...
```

### app.json

Les paramètres principaux se trouvent dans `app.json` :

- `extra.apiUrl` — URL du backend (production)
- `plugins` — Expo Router, SecureStore, Unistyles, Stripe

### Sync des types

Les types tRPC sont résolus via un alias TypeScript (`@server/*` → `../app/src/*`).  
Pour copier les DTOs partagés :

```bash
npm run sync-types
```

## Développement

### Lancer le serveur Metro

```bash
npx expo start --dev-client
```

> Utilisez `--dev-client` car les SDK natifs (Agora, Stripe) nécessitent un Development Build.

### Créer un Development Build

```bash
# iOS (simulateur)
eas build --profile development --platform ios

# Android (appareil)
eas build --profile development --platform android
```

### Lancer sur un appareil

1. Installez le dev build sur l'appareil
2. Lancez `npx expo start --dev-client`
3. Scannez le QR code ou entrez l'URL

## Build de production

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Submit sur les stores

```bash
eas submit --platform ios
eas submit --platform android
```

## Structure du projet

```
mobile-app/
├── app/                          # Expo Router — écrans
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Redirect → (tabs)
│   ├── (auth)/                   # Auth screens (login, register)
│   ├── (tabs)/                   # Tab navigator
│   │   ├── index.tsx             # Dashboard
│   │   ├── channels.tsx          # Live channels list
│   │   ├── orders.tsx            # User orders
│   │   ├── profile.tsx           # Profile & settings
│   │   └── shop/                 # Seller shops
│   ├── channel/
│   │   ├── [channelId].tsx       # Live viewer (buyer)
│   │   └── [channelId]/host.tsx  # Live host (seller)
│   ├── create-channel.tsx        # Create live channel
│   ├── order/[orderId].tsx       # Order detail & payment
│   └── shop/[id]/               # Shop detail, edit, deliveries, products
├── src/
│   ├── components/               # Composants réutilisables
│   │   ├── ErrorBoundary.tsx     # Global error boundary
│   │   ├── ErrorScreen.tsx       # Error state screen
│   │   ├── NetworkAlert.tsx      # Offline banner
│   │   ├── LoadingScreen.tsx     # Loading state
│   │   ├── EmptyState.tsx        # Empty list state
│   │   ├── ChannelCard.tsx       # Channel card
│   │   ├── OrderCard.tsx         # Order card
│   │   ├── ShopCard.tsx          # Shop card
│   │   ├── ProductCard.tsx       # Product card
│   │   ├── ImageUploader.tsx     # Image picker + upload
│   │   ├── TabBarIcon.tsx        # Tab bar icon
│   │   └── live/                 # Live stream components
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state management
│   ├── hooks/
│   │   ├── useUserRole.ts        # Role-based access
│   │   ├── useNetworkStatus.ts   # Network connectivity
│   │   └── usePayment.ts         # Stripe payment flow
│   ├── lib/
│   │   ├── trpc.ts               # tRPC client setup
│   │   ├── auth.ts               # SecureStore JWT helpers
│   │   ├── config.ts             # API URLs from config
│   │   ├── queryClient.ts        # React Query client
│   │   ├── theme.ts              # Design tokens
│   │   └── unistyles.ts          # Unistyles setup
│   └── providers/
│       ├── TRPCProvider.tsx       # tRPC + QueryClient provider
│       └── StripeProvider.tsx     # Stripe provider wrapper
├── assets/                       # Icons, splash screen
├── scripts/
│   └── sync-types.sh             # DTO sync script
├── app.json                      # Expo config
├── eas.json                      # EAS build profiles
├── tsconfig.json                 # TypeScript config
└── package.json
```

## Fonctionnalités

### Acheteur (Buyer)

- Inscription / Connexion
- Liste des channels live
- Viewer vidéo temps réel (Agora RTC)
- Chat en direct (WebSocket)
- Enchères avec compte à rebours
- Paiement via Stripe PaymentSheet
- Suivi des commandes

### Vendeur (Seller)

- Gestion de boutiques
- Gestion de produits avec upload d'images
- Création de channels live
- Hébergement de stream vidéo
- Mise en avant de produits pendant le live
- Lancement d'enchères en direct
- Gestion des livraisons

## Gestion d'erreurs

- **ErrorBoundary** — Capture les crashes JS non gérés avec écran de retry
- **NetworkAlert** — Bannière en haut de l'écran quand le device est hors ligne
- **ErrorScreen** — État d'erreur sur toutes les pages avec bouton « Réessayer »
- **Mutations** — Errors gérées via `Alert.alert()` natif

## Notes

- Le backend doit être accessible depuis le device (IP locale pour le dev, URL publique pour la prod)
- Les SDK Agora et Stripe nécessitent des modules natifs → pas compatible avec Expo Go
- Les types serveur sont résolus via `@server/*` sans copie — seuls les DTOs sont copiés

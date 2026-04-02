# Ticket 005 — Frontend: extract hooks from ProfilePage

## Acceptance Criteria

- As a developer, `ProfilePage.tsx` should contain only JSX (no tRPC calls, no useState, no useEffect)
- As a developer, all state, mutations, queries, and handlers should live in `ProfilePage.hooks.ts` and be exported via a single `useProfile()` hook

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/ProfilePage.hooks.ts` *(new)*
      - `useProfile()`: exports all state (firstName, lastName, avatarPreview, address forms, dialog open states, relay picker state), all tRPC queries (profile.me, payment.getPaymentStatus, searchRelayPoints) and mutations (logout, updateProfile, createAddress, updateAddress, deleteAddress, deletePaymentMethod, saveRelayPoint, setDefaultAddress, imageUpload, updateAvatarMutation), all handlers (handleFileSelect, handleAvatarSave, handleUpdateProfile, handleAddAddress, handleEditAddress, handleDeleteAddress, handleSubmitAddress, confirmDelete), and derived state (isAvatarUploading)
      - Also exports `AddressFormData` interface and `emptyAddress` constant
    - `app/client/src/pages/ProfilePage.tsx` *(modified)*
      - Removes all state, tRPC, and handlers
      - Imports `useProfile` and `emptyAddress` from `./ProfilePage.hooks`
      - Contains only JSX referencing the hook's return values
      - Also replaces `text-green-500` (payment method check icon) with `text-success` and `text-amber-500` (no payment method alert) with `text-warning`

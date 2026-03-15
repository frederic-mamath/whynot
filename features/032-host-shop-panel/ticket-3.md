# Ticket 3 — Wire VerticalControlPanel + LiveDetailsPage

## Acceptance Criteria

- As a seller host, in the live details page, I should see a "My shop" button in the VerticalControlPanel (visible only when I am the host).
- As a seller host, when I click "My shop", a side panel opens showing the ShopPanel.
- As a viewer (non-host), the "My shop" button should NOT be visible.

## Technical Strategy

- Frontend
  - Component (`app/client/src/components/VerticalControlPanel/VerticalControlPanel.tsx`)
    - Add prop: `onShowShop?: () => void`
    - Add button: rendered only when `showBroadcastControls && onShowShop`. Uses `Store` icon from Lucide. Positioned after the existing product buttons.
  - Page (`app/client/src/pages/LiveDetailsPage.tsx`)
    - Add state: `const [showShop, setShowShop] = useState(false)`
    - Pass `onShowShop={() => setShowShop(true)}` to `<VerticalControlPanel />` (only when `channelConfig?.isHost`).
    - Render `<ShopPanel channelId={Number(channelId)} isOpen={showShop} onClose={() => setShowShop(false)} />` conditionally when `channelConfig?.isHost`.

## Manual operations to configure services

None.

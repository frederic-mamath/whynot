# Ticket 001 — Unified delivery address card with Mondial Relay map dialog

## Acceptance Criteria

- As a buyer, on the profile page, I see a single "Adresse de livraison" card instead of two separate cards.
- As a buyer, when no address is set, I see a `Placeholder` with two buttons: "Ajouter une adresse à la main" and "Choisir avec Mondial Relay".
- As a buyer, tapping "Ajouter une adresse à la main" opens the existing address form dialog.
- As a buyer, tapping "Choisir avec Mondial Relay" opens a new dialog containing a postcode search field and a Leaflet map (OpenStreetMap tiles, no API key required).
- As a buyer, after entering a postcode and tapping "Rechercher", the map zooms to the area and drops a marker for each nearby relay point.
- As a buyer, tapping a marker shows a popup with the relay point name and address, and a "Choisir ce point" button.
- As a buyer, tapping "Choisir ce point" saves the relay point and closes the dialog.
- As a buyer, when an address is already set, I see the address details and two "change" buttons ("Ajouter une adresse à la main" / "Choisir avec Mondial Relay") plus a delete button.
- As a buyer, tapping "Ajouter une adresse à la main" from the populated state replaces the current address with the new one.
- As a buyer, the Mondial Relay dialog resets its postcode, search results, and selected marker every time it is closed.

---

## Technical Strategy

- **Frontend**
  - Dependencies
    - Install `leaflet`, `react-leaflet`, and `@types/leaflet` via npm.
    - Leaflet's CSS (`leaflet/dist/leaflet.css`) must be imported once, either in the component or in `index.css`.

  - New component
    - `app/client/src/components/MondialRelayMapDialog/MondialRelayMapDialog.tsx`
      - Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `onSave: (point: RelayPoint) => void` where `RelayPoint` is imported from the tRPC inferred output type of `profile.searchRelayPoints`.
      - All state is **local** (postcode, searchEnabled, selectedPoint) and resets via a `useEffect` on `open` becoming `false` (or by keying the dialog).
      - Layout inside a `<Dialog>`:
        - Header: title "Choisir un Point Relais".
        - Search row: `<Input>` for postcode + "Rechercher" `<ButtonV2>` (disabled while `postcode.length < 4`).
        - Map area: `<MapContainer>` from `react-leaflet` with `<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />`. Default center: `[46.2, 2.2]` (France), zoom 6.
        - When results arrive: call `map.flyTo([firstPoint.latitude, firstPoint.longitude], 13)` using a `useMap()` helper child component.
        - Each relay point: `<Marker position={[point.latitude, point.longitude]}>` with a `<Popup>` containing the point name, address, and a "Choisir ce point" `<ButtonV2>` that calls `onSave(point)` then `onOpenChange(false)`.
      - Calls `trpc.profile.searchRelayPoints.useQuery({ postcode, country: "FR" }, { enabled: searchEnabled })` internally.
      - **Note — coordinates confirmed available**: `MondialRelayService.searchRelayPoints` already maps `Latitude`/`Longitude` from the SOAP response into `RelayPoint.latitude` / `RelayPoint.longitude`. No backend changes needed.

  - Hook changes
    - `app/client/src/pages/ProfilePage.hooks.ts`
      - Remove: `relayPostcode`, `setRelayPostcode`, `relaySearchEnabled`, `setRelaySearchEnabled`, `searchRelayPoints` (all moved into `MondialRelayMapDialog` local state).
      - Add: `relayDialogOpen: boolean`, `setRelayDialogOpen`.
      - Modify `createAddress` call site: before inserting a new manual address, delete any existing address for the user. Add a helper `handleReplaceWithManual` that calls `deleteAddress.mutateAsync` on the existing address (if any) then opens `addressDialogOpen`.
      - Expose: `relayDialogOpen`, `setRelayDialogOpen`, `handleReplaceWithManual`.

  - View changes
    - `app/client/src/pages/ProfilePage.tsx`
      - **Remove** the entire "Point Relais Mondial Relay" `<Card>` block (lines ~398–486).
      - **Modify** the "Adresses de livraison" `<EntityConfigurationCard>`:
        - `title`: `"Adresse de livraison"` (singular)
        - `description`: `"Choisissez comment vous souhaitez recevoir vos commandes"`
        - `PlaceholderProps`:
          ```tsx
          {
            Icon: <MapPin className="size-10" />,
            title: t("profile.addresses.empty"),
            ButtonListProps: [
              {
                icon: <MapPin className="size-4" />,
                label: "Ajouter une adresse à la main",
                onClick: handleAddAddress,
                className: "border border-border bg-background text-foreground",
              },
              {
                icon: <Package className="size-4" />,
                label: "Choisir avec Mondial Relay",
                onClick: () => setRelayDialogOpen(true),
                className: "border border-border bg-background text-foreground",
              },
            ],
          }
          ```
        - `children` (when `profile?.addresses.length > 0`): render the single address row (label, street, city/zip) without star/default logic, followed by two outlined "change" buttons and a destructive delete button:
          ```tsx
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <p className="font-semibold">{address.label}</p>
              <p className="text-sm text-muted-foreground">{address.street}</p>
              <p className="text-sm text-muted-foreground">{address.city}, {address.zipCode}</p>
            </div>
            <ButtonV2
              icon={<MapPin className="size-4" />}
              label="Ajouter une adresse à la main"
              onClick={handleReplaceWithManual}
              className="border border-border bg-background text-foreground w-full"
            />
            <ButtonV2
              icon={<Package className="size-4" />}
              label="Choisir avec Mondial Relay"
              onClick={() => setRelayDialogOpen(true)}
              className="border border-border bg-background text-foreground w-full"
            />
            <button
              onClick={() => handleDeleteAddress(address.id)}
              className="text-destructive text-sm flex items-center gap-1 mx-auto"
            >
              <Trash2 className="size-3" /> Supprimer l'adresse
            </button>
          </div>
          ```
        - Remove the `isDefault`, `Star`, `setDefaultAddress` logic entirely (0 or 1 address, no default concept needed).
      - Add `<MondialRelayMapDialog open={relayDialogOpen} onOpenChange={setRelayDialogOpen} onSave={(point) => saveRelayPoint.mutate({ relayPointId: point.id, name: point.name, street: point.address, city: point.city, zipCode: point.zipCode, country: point.country })} />` just before the closing `</div>` of the page.
      - Remove unused imports: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` (if no longer used), `Star`.

---

## Manual operations to configure services

None. OpenStreetMap tiles are free and require no API key or account setup.

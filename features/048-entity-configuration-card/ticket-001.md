# Ticket 001 — Create EntityConfigurationCard component + migrate ProfilePage (Payment & Addresses)

## Acceptance Criteria

- As a developer, I can import `EntityConfigurationCard` and render a consistent card with icon, title, description, and either a `Placeholder` (when empty) or custom content (when items exist).
- As a buyer, on the profile page, the Payment card and the Addresses card both use `EntityConfigurationCard` with a visually consistent header.
- As a buyer, on the profile page, when no payment method exists, the "Ajouter un moyen de paiement" action appears inside the `Placeholder`, not in the card header.
- As a buyer, on the profile page, when no address exists, the "Ajouter une adresse" action appears inside the `Placeholder`, not in the card header.
- As a buyer, on the profile page, when payment methods exist, a "Modifier" button appears at the bottom of the payment methods list (inside the card content).
- As a buyer, on the profile page, when addresses exist, an "Ajouter une adresse" button appears at the bottom of the address list (inside the card content).

---

## Technical Strategy

- **Frontend**
  - Component (new file)
    - `app/client/src/components/ui/EntityConfigurationCard/EntityConfigurationCard.tsx`
      - Props interface:
        ```ts
        interface EntityConfigurationCardProps {
          Icon: React.ReactNode;
          title: string;
          description: string;
          PlaceholderProps: PlaceholderProps; // always required — defines the empty state
          children?: React.ReactNode;         // when provided, rendered instead of Placeholder
        }
        ```
      - Layout: outer `<div className="bg-card border border-border rounded-xl p-4 space-y-4">` (no dependency on the shadcn `Card` component — own the styling for full control).
      - Header row: `<div className="flex items-center gap-2">` containing `{Icon}` + `<h2 className="text-base font-syne font-bold text-foreground">{title}</h2>`.
      - Description: `<p className="text-sm text-muted-foreground">{description}</p>`.
      - Content: `{children ?? <Placeholder {...PlaceholderProps} />}`.
      - Export as default.

  - Migration
    - `app/client/src/pages/ProfilePage.tsx`
      - Remove the shadcn `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` imports (only if they become entirely unused after the migration — keep them if still used by other cards on the page).
      - Import `EntityConfigurationCard`.

      **Payment section** (currently lines ~243–315):
      - Replace the `<Card>` block with `<EntityConfigurationCard>`:
        ```tsx
        <EntityConfigurationCard
          Icon={<CreditCard className="size-5" />}
          title={t("profile.payment.title")}
          description={t("profile.payment.description")}
          PlaceholderProps={{
            Icon: <AlertCircle className="size-10" />,
            title: t("profile.payment.noMethod"),
            ButtonListProps: [{
              icon: <CreditCard className="size-4" />,
              label: t("profile.payment.addMethod"),
              onClick: () => setPaymentDialogOpen(true),
              className: "bg-primary text-primary-foreground",
            }],
          }}
        >
          {paymentStatus?.hasPaymentMethod ? (
            <div className="space-y-3">
              {/* existing payment method rows */}
              <ButtonV2
                className="border border-border bg-background text-foreground w-full mt-2"
                onClick={() => setPaymentDialogOpen(true)}
                label={t("profile.payment.change")}
              />
            </div>
          ) : undefined}
        </EntityConfigurationCard>
        ```
        - Pass `children` only when `paymentStatus?.hasPaymentMethod` is true. When falsy, pass `undefined` so the `Placeholder` renders.
        - The previous inline header `ButtonV2` ("Modifier") moves to the bottom of the children content.

      **Addresses section** (currently lines ~326–415):
      - Replace the `<Card>` block with `<EntityConfigurationCard>`:
        ```tsx
        <EntityConfigurationCard
          Icon={<MapPin className="size-5" />}
          title={t("profile.addresses.title")}
          description={t("profile.addresses.description")}
          PlaceholderProps={{
            Icon: <MapPin className="size-12" />,
            title: t("profile.addresses.empty"),
            ButtonListProps: [{
              icon: <Plus className="size-4" />,
              label: t("profile.addresses.add"),
              onClick: handleAddAddress,
              className: "bg-primary text-primary-foreground",
            }],
          }}
        >
          {profile?.addresses.length > 0 ? (
            <div className="space-y-4">
              {/* existing address rows */}
              <ButtonV2
                icon={<Plus className="size-4" />}
                label={t("profile.addresses.add")}
                onClick={handleAddAddress}
                className="bg-primary text-primary-foreground w-full mt-2"
              />
            </div>
          ) : undefined}
        </EntityConfigurationCard>
        ```
        - The "Ajouter une adresse" button that was previously in the card header moves to two places: inside `PlaceholderProps.ButtonListProps` (empty state) and at the bottom of `children` (populated state).
        - Remove the header-level `ButtonV2` from the old `CardHeader`.

---

## Manual operations to configure services

None.

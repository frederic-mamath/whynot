# Ticket 001 — Create Placeholder component + migrate ProfilePage

## Acceptance Criteria

- As a developer, I can import a `Placeholder` component and render a consistent empty state by passing an `Icon`, a `title`, and an optional list of button props.
- As a buyer, on the profile page, the payment method empty state uses the new `Placeholder` component.
- As a buyer, on the profile page, the delivery addresses empty state uses the new `Placeholder` component.

---

## Technical Strategy

- **Frontend**
  - Component (new file)
    - `app/client/src/components/ui/Placeholder/Placeholder.tsx`
      - Props interface:
        ```ts
        interface PlaceholderProps {
          Icon: React.ReactNode;
          title: string;
          ButtonListProps?: React.ComponentProps<typeof ButtonV2>[];
        }
        ```
      - Layout: vertically centred column (`flex flex-col items-center text-center`), with vertical padding (`py-6`) and gap between slots (`gap-4`).
      - Icon slot: render `Icon` wrapped in a `text-muted-foreground` container.
      - Title slot: `<p className="text-sm font-medium text-foreground">`.
      - Buttons slot: if `ButtonListProps` is non-empty, render a `flex flex-col gap-3 w-full` wrapper and spread each entry as props into a `<ButtonV2 />`.
      - Export as default.
  - Migration
    - `app/client/src/pages/ProfilePage.tsx`
      - **Payment empty state** (currently lines ~301–316): replace the hand-rolled `<div className="text-center py-6">` block with `<Placeholder Icon={<AlertCircle className="size-10" />} title={t("profile.payment.noMethod")} ButtonListProps={[{ icon: <CreditCard className="size-4" />, label: t("profile.payment.addMethod"), onClick: () => setPaymentDialogOpen(true), className: "bg-primary text-primary-foreground" }]} />`.
      - **Addresses empty state** (currently lines ~351–356): replace the `<div className="text-center py-8 text-muted-foreground">` block with `<Placeholder Icon={<MapPin className="size-12" />} title={t("profile.addresses.empty")} />` (no buttons — the add button lives in the section header, not in the empty state).

---

## Manual operations to configure services

None.

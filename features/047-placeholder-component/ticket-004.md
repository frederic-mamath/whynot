# Ticket 004 — Migrate BidHistory, MessageList, VendorList, ParticipantList, PromotedProducts

## Acceptance Criteria

- As a user, on each of the five components below, the empty state renders using the `Placeholder` component with a consistent layout.
- The app builds with zero errors after the migration.

---

## Technical Strategy

- **Frontend**
  - Migration
    - `app/client/src/components/BidHistory/BidHistory.tsx`
      - Current empty state is text-only (no icon). Introduce a fitting icon from Lucide.
      - Replace with: `<Placeholder Icon={<Gavel className="size-8" />} title={t("auction.history.noBids")} />`

    - `app/client/src/components/MessageList/MessageList.tsx`
      - Replace the `<div className="flex flex-col items-center justify-center h-full ...">` block with:
        `<Placeholder Icon={<MessageCircle className="size-12" />} title={t("messages.empty")} />`
      - The secondary line `t("messages.startConversation")` is dropped — it will be folded into or replaced by the `title` translation value if needed, as the `Placeholder` supports a single title only.

    - `app/client/src/components/VendorList/VendorList.tsx`
      - Replace the `<div className="text-center py-8">` block with:
        `<Placeholder Icon={<Users className="size-10" />} title={t("vendors.noVendors")} />`
      - The conditional `isOwner` hint text is dropped — it duplicates context already available in the page.

    - `app/client/src/components/ParticipantList/ParticipantList.tsx`
      - Replace the `<div className="text-center py-8 px-4 rounded-lg bg-accent/30 border border-dashed border-border">` block with:
        `<Placeholder Icon={<Users className="size-12" />} title={t("participants.noOthers")} />`
      - The `border-dashed` container styling is removed — the `Placeholder` component has no background/border of its own per the design spec.

    - `app/client/src/components/PromotedProducts/PromotedProducts.tsx`
      - Replace the `<div className="text-center py-8 px-4 rounded-lg bg-accent/30 border border-dashed border-border">` block with:
        `<Placeholder Icon={<ShoppingBag className="size-12" />} title={t("promotedProducts.emptyState")} />`
      - Same note: dashed container styling removed.

---

## Manual operations to configure services

None.

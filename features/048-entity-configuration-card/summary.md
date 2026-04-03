# 048 — EntityConfigurationCard Component

## Initial Prompt

> I would like a component for cards to configure entities. For example in the ProfilePage, there are two different designs for payment cards and delivery addresses. Create a shared `EntityConfigurationCard` component (Icon, title, description, PlaceholderProps, children?) and migrate the Payment and Addresses cards in ProfilePage to use it. Actions must be inside the Placeholder, not in the card header. When items exist, the component renders children instead of the Placeholder.

---

## Progress

| User Story | Status |
| :--- | :--- |
| As a developer, the `EntityConfigurationCard` component exists and is usable | completed |
| As a buyer, the Profile > Payment card uses `EntityConfigurationCard` | completed |
| As a buyer, the Profile > Addresses card uses `EntityConfigurationCard` | completed |
| As a buyer, header action buttons are removed — actions live inside Placeholder or children | completed |

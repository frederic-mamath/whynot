# 044 — Sellers Discovery

## Initial Prompt

> In the home page, the user is seeing a button "Voir tout" when there is only a few sellers. I would like to see only the first 10 sellers on this page. If there is less than 10 sellers, I would like the button "Voir tout" to be hidden. The button should appear only if there are 10 or more sellers. When the button is visible, it should navigate to a new /sellers page that will list all users with the seller roles by their username ordered ASC. For each user, we will only display their username with placeholder buttons for incoming features: "Contacter" and "Suivre". When hovering them, you will see a tooltip "Bientôt disponible...". The limit should be implemented in the backend.

---

## Progress

| User Story | Status |
| :--- | :--- |
| As a buyer, on the home page, I see at most 10 sellers | completed |
| As a buyer, on the home page, "Voir tout" is hidden when fewer than 11 sellers exist | completed |
| As a buyer, on the home page, "Voir tout" navigates to /sellers when 11+ sellers exist | completed |
| As a buyer, on /sellers, I see all sellers ordered by username ASC | completed |
| As a buyer, on /sellers, placeholder buttons show a "Bientôt disponible..." tooltip on hover | completed |

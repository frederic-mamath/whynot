# Feature 039 — Instant Seller Activation

**Initial prompt:**

As a user, I don't want to wait for permissions to become a seller. After being onboarded through the 10 steps, the 11th one is to give feedback to the user that he has become a seller!

The next time the user goes to the "Vendre" page, he will access the "SellerShopPage" that will allow him to create products in his shop.

---

## User Stories

| User Story | Status |
| :--------- | :----- |
| As a user completing step 10, when I click "Devenir vendeur", my SELLER role should be granted immediately (no admin approval required) | completed |
| As a user completing step 10, after clicking "Devenir vendeur", I should see a celebration screen "Félicitations, vous êtes vendeur !" | completed |
| As a newly activated seller, when I click "Accéder à mon espace vendeur", I should be redirected to `/seller/shop` | completed |
| As a seller, when I tap "Vendre" in the bottom navigation, I should be routed to `/seller/shop` | completed |
| As a seller, when I navigate directly to `/vendre`, I should be redirected to `/seller/shop` | completed |

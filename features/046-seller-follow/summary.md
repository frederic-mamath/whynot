# 046 — Seller Follow

## Initial Prompt

> In the home page, I want users to be able to follow and unfollow sellers. When the seller plans a new live, an e-mail will be sent to all its followers with the starting date and a link to join the live. The behaviour should be functional on both the home page and the /sellers page. Followed button: yellow background (`bg-b-primary`) + black text (`text-txt-primary`). Unfollow requires a confirmation dialog. Email sent via Mailjet and includes seller name, live title, description, start date, and a join link using FRONTEND_URL env var.

---

## Progress

| User Story | Status |
| :--- | :--- |
| As a buyer, on the home page, I can follow a seller and see the button switch to yellow/black | completed |
| As a buyer, on the home page, I can unfollow a seller via a confirmation dialog | completed |
| As a buyer, on /sellers, I can follow and unfollow sellers with the same behaviour | completed |
| As a buyer, my follow state is reflected on page load without any action | completed |
| As a buyer who follows a seller, I receive an email when that seller schedules a new live | completed |

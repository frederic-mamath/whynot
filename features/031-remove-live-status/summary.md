# Feature 031 — Remove Live Status

**Initial prompt:**

> I want to remove the live status attribute. A live should be considered active if the current time is after its start date and before its end date.

---

## User Stories

| User Story                                                                                                                                   | Status  |
| :------------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| As a seller, when I click "Démarrer" on a scheduled live, I am taken directly to the live page without a server-side state transition        | planned |
| As a user, when I open a live page before its start time, I see a "Ce live n'a pas encore commencé" placeholder with the countdown           | planned |
| As a user, when I open a live page after its end time, I see a "Ce live est terminé" placeholder                                             | planned |
| As a developer, the `status` column no longer exists on the `lives` table — liveness is determined by `starts_at`, `ends_at`, and `ended_at` | planned |

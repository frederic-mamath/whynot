---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 22px;
  }
  section.lead {
    background: #0f172a;
    color: #f8fafc;
    text-align: center;
  }
  section.lead h1 { color: #f8fafc; font-size: 2.4em; margin-bottom: 0.2em; }
  section.lead h2 { color: #94a3b8; font-size: 1.2em; font-weight: normal; }
  section.lead p  { color: #cbd5e1; font-size: 0.95em; }
  h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.2em; font-size: 1.5em; }
  table { width: 100%; font-size: 0.85em; }
  th { background: #f1f5f9; color: #0f172a; }
  td, th { padding: 6px 10px; }
  strong { color: #0f172a; }
---

<!-- _class: lead -->

# Popup — Week XX
## Apr XX – Apr XX, 2026

**Sprint goal:** _One sentence describing the week's main objective_

&nbsp;

Overall status: &nbsp; 🟢 On track &nbsp;&nbsp;|&nbsp;&nbsp; 🟡 At risk &nbsp;&nbsp;|&nbsp;&nbsp; 🔴 Off track

<!-- Circle the status above by deleting the other two, or bold the active one. -->

---

# KPI Dashboard

<!-- Update every metric before the meeting. Traffic light: 🟢 good / 🟡 watch / 🔴 action needed. -->
<!-- POST-LAUNCH swap: "Launch Readiness %" → GMV (€) | "Seller Pipeline" → "Active Sellers this week" | "Buyer Waitlist" → "New Buyers" -->

| Metric | This week | Last week | Status |
|--------|-----------|-----------|:------:|
| Launch Readiness | XX% | XX% | 🟢 |
| Seller Pipeline | X contacted / X interested / X committed | — | 🟡 |
| App Store Status | Not submitted / Under review / Approved | — | 🔴 |
| Sprint Velocity | X / X tickets closed | X / X | 🟢 |
| Open Critical Bugs | X | X | 🟢 |
| Buyer Waitlist | X signups | X signups | 🟢 |

---

# Launch Readiness

<!-- Check off items as they ship. This list is the source of truth for the Launch Readiness % above. -->
<!-- Add new items if blockers surface. Delete items if scope is cut consciously. -->

**Must-ship before going live:**

- [ ] Core buyer flow (browse → bid → buy → pay)
- [ ] Core seller flow (create shop → list products → go live → auction)
- [ ] Stripe checkout (buyers) + Stripe Connect payout (sellers)
- [ ] App Store submission accepted (iOS)
- [ ] Legal: CGV + Politique de confidentialité + RGPD notice
- [ ] First 3 sellers onboarded + tested the full flow end-to-end
- [ ] Push notifications (live started, auction won, order update)
- [ ] Basic onboarding (nickname + avatar setup)

---

# Seller Pipeline

<!-- List real names or pseudonyms. Move them right as they progress. Max ~5 per column. -->
<!-- Goal: 3 committed sellers before launch day. "Committed" = agreed to do a real live on launch week. -->

| Outreach | Interested | Committed |
|:---------|:-----------|:----------|
| _Name 1_ | _Name A_   | _Name X_  |
| _Name 2_ | _Name B_   | —         |
| _Name 3_ | —          | —         |

&nbsp;

**Target before launch:** 3 committed sellers &nbsp;|&nbsp; **This week's goal:** _X new conversations started_

---

# Wins This Week

<!-- Max 3 bullets. Be specific: "shipped X", "unblocked Y", "received signal Z". -->
<!-- If you're tempted to add a 4th, cut the weakest one — this is a discipline, not a format. -->

&nbsp;

1. **[Win 1]** — _what was shipped or unlocked_

2. **[Win 2]** — _milestone hit or signal received_

3. **[Win 3]** — _team or process improvement_

---

# Challenges

<!-- Max 4 rows. If you have more than 4 active blockers you have a prioritisation problem. -->
<!-- Impact: High = blocks launch | Med = slows progress | Low = annoying but workable -->

| Challenge | Impact | Owner + Next Action |
|-----------|:------:|---------------------|
| _Describe the blocker clearly_ | High | _Name_ — _specific action by date_ |
| _Describe the blocker clearly_ | Med  | _Name_ — _specific action by date_ |
| _Describe the blocker clearly_ | Low  | _Name_ — _specific action by date_ |

---

# Next Week

<!-- Exactly 3 priorities. Each needs one DRI (the single person accountable) and a clear "done looks like". -->
<!-- If you can't define "done looks like", the priority is not ready to be worked on yet. -->

| # | Priority | DRI | Done looks like |
|:-:|----------|:---:|-----------------|
| 1 | _Top priority_ | _Name_ | _Specific, observable outcome_ |
| 2 | _Second priority_ | _Name_ | _Specific, observable outcome_ |
| 3 | _Third priority_ | _Name_ | _Specific, observable outcome_ |

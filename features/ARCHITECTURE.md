# Features Track Architecture

**Last Updated**: March 4, 2026

---

## Purpose

The `features` directory tracks **new feature development** — user-facing functionality, UI improvements, and business capabilities.

---

## Directory Structure

> **Note:** Features 001–015 use the legacy phase-based structure (`phase-N-{name}.md`).
> **From feature 016 onwards**, the ticket-based structure below is the standard.

```
features/
├── ARCHITECTURE.md
├── {NNN}-{feature-name}/
│   ├── summary.md
│   └── ticket-{XXX}.md
```

### Naming Convention

- Directory: `{NNN}-{kebab-case-name}` (e.g. `016-stripe-checkout`)
- Tickets: `ticket-01.md`, `ticket-02.md`, …

---

## Core Philosophy

1. **Atomic Delivery**: Each ticket is completable in **one working day** by one developer.
2. **Stability First**: After every ticket, the app must be **buildable and stable**.
3. **The Human is Master**: Tickets map the developer's vision into an executable plan.

---

## `summary.md` Template

```markdown
# Feature NNN — {Feature Name}

## Overview

One-sentence description.

## User Stories

| User Story                          | Status                           |
| :---------------------------------- | :------------------------------- |
| As a..., when I..., I should see... | planned / developing / completed |

## Tickets

| Ticket                      | Description       | Status                           |
| :-------------------------- | :---------------- | :------------------------------- |
| [ticket-01](./ticket-01.md) | Short description | planned / developing / completed |
```

---

## `ticket-XXX.md` Template

```markdown
# Ticket XX — {Title}

## Acceptance Criteria

- As <user_type>, in <page_name>, when I <action>, I should see <expected_output>

## Technical Strategy

- Backend | Frontend
  - <Layer> (e.g. Service, Repository, Component)
    - `<File Path>`
      - `<function or block>`: Brief description.

## Manual operations to configure services

- Name of the service (e.g. Stripe, Agora…)
- Step-by-step instructions for any third-party configuration needed.
```

---

## Legacy Structure (features 001–015)

Features 001–015 use the older phase-based format:

```
{NNN}-{feature-name}/
├── summary.md
├── phase-1-{name}.md
├── phase-2-{name}.md
└── phase-N-{name}.md
```

Do **not** apply the ticket format to these existing features.

---

## Related Documentation

- `../ARCHITECTURE.md` — Overall system architecture
- `../STYLING.md` — UI/styling conventions (mandatory for all features)
- `../dev-quality/ARCHITECTURE.md` — Technical improvement tracks

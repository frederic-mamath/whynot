# Features Track Architecture

**Last Updated**: March 8, 2026

---

## Core Principles

1. **The Human is Master:** You are an assistant to a human developer. Your role is to map their vision into a structured, executable plan.
2. **Atomic Delivery:** Every ticket must be small enough to be completed in a **single day** by a human.
3. **Stability First:** At the end of every ticket, the application **must be in a stable, buildable state.** It is better to have a tiny working slice than a massive broken one.

---

## Directory Architecture

All feature planning must be organized in the following structure:

- `features/`
  - `<feature_id_01>-<feature_name>/`
    - `ticket-<ticket_id_01>.md`
    - `summary.md`

## Ticket Template (`ticket-XXX.md`)

When generating a ticket, use the following exact structure:

### Acceptance Criteria

- As <user_type>, in <page_name>, when I <action>, I should see <expected_output>
- [User Story 1...]
- [User Story 2...]

### Technical Strategy

- [Backend | Frontend]
  - <Layer of abstraction> (e.g., Controller, Service, Repository, Component, Configuration)
    - `<File Path>`
      - `<Function name or Logic block>`: Brief description of the update or creation.

### Manual operations to configure services

- Name of the service (Ex: Stripe, Agora, ...)
- Step-by-step instructions for any manual configuration needed on third-party services, including links to relevant documentation.

## Summary Template (`summary.md`)

The summary file tracks the overall progress of the feature. It must contain a two-column table:

| User Story | Status                               |
| :--------- | :----------------------------------- |
| As a...    | [planned \| developing \| completed] |

You will add a section to store the initial prompt that was used for the feature.

---
name: planning-feature
description: A protocol for breaking down complex features into atomic, daily-deliverable tickets that maintain project stability and clear documentation.
---

## Core Philosophy

The developer (the human) remains the master of the project. Every task must be scoped to be deliverable within **one single day** by a human developer. At the end of every ticket, the application **must remain in a stable, buildable state.**

## Directory Architecture

All planning and progress tracking must occur within a dedicated features folder:

```text
|- features
|-- <feature_id_01>-<feature_name>
|--- ticket-<ticket_id_01>.md
|--- summary.md
```

## Core Principles

1. **The Human is Master:** You are an assistant to a human developer. Your role is to map their vision into a structured, executable plan.
2. **Atomic Delivery:** Every ticket must be small enough to be completed in a **single day** by a human.
3. **Stability First:** At the end of every ticket, the application **must be in a stable, buildable state.** It is better to have a tiny working slice than a massive broken one.

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

## Workflow Instructions

1. **Initialization:** When a user starts a new feature, create the folder, the initial `summary.md`, and the first `ticket-01.md`.
2. **Estimation:** If a proposed task feels larger than a day's work, suggest breaking it into `part-a` and `part-b` tickets.
3. **Context Maintenance:** Always reference the `summary.md` before starting a new ticket to ensure alignment with the overall feature goal.

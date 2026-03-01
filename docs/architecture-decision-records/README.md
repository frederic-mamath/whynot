# Architecture Decision Records (ADR)

## What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences. ADRs help the team understand **why** decisions were made, not just **what** was decided.

We use ADRs to:

- Document significant technical choices that affect the project's direction
- Provide context for future team members joining the project
- Track the evolution of our architecture over time
- Avoid revisiting decisions without new information

## Conventions

### Naming

Each ADR is a Markdown file in this directory, named:

```
NNN-short-descriptive-title.md
```

Where `NNN` is a zero-padded sequential number (e.g., `001`, `002`).

### Statuses

| Status                  | Meaning                                      |
| ----------------------- | -------------------------------------------- |
| `proposed`              | Under discussion, not yet agreed upon        |
| `accepted`              | Agreed and in effect                         |
| `deprecated`            | No longer relevant (superseded or abandoned) |
| `superseded by ADR-NNN` | Replaced by a newer decision                 |

### Immutability

Once accepted, an ADR should **not** be modified. If a decision changes, create a new ADR that supersedes the previous one and update the old ADR's status.

---

## Template

Use the following template when creating a new ADR:

```markdown
# ADR-NNN: Title

**Status:** proposed | accepted | deprecated | superseded by ADR-NNN

**Date:** YYYY-MM-DD

## Context

What is the issue that we're seeing that motivates this decision or change?
Describe the forces at play (technical, business, team, etc.).

## Decision

What is the change that we're proposing and/or doing?
State the decision clearly and concisely.

## Alternatives Considered

| Alternative | Pros | Cons | Verdict           |
| ----------- | ---- | ---- | ----------------- |
| Option A    | ...  | ...  | Rejected / Chosen |
| Option B    | ...  | ...  | Rejected / Chosen |

## Consequences

### Positive

- What becomes easier or possible as a result of this change?

### Negative

- What becomes harder or is a trade-off?

### Risks

- What could go wrong? What needs monitoring?
```

---

## Index

| #                                         | Title                       | Status   | Date       |
| ----------------------------------------- | --------------------------- | -------- | ---------- |
| [001](001-mobile-app-technology-stack.md) | Mobile App Technology Stack | accepted | 2026-03-01 |

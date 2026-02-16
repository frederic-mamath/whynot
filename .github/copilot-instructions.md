# GitHub Copilot Instructions for WhyNot Project

## Context Files

Always include these files in your context when working on this project:

- `STYLING.md` - Complete styling guide with Shadcn UI and Tailwind CSS conventions
- `ARCHITECTURE.md` - System architecture and project structure
- `README.md` - Project overview and setup instructions
- `dev-quality/ARCHITECTURE.md` - Dev-quality track structure and guidelines
- `features/ARCHITECTURE.md` - Features track structure and guidelines
- `docs/adr/README.md` - Architecture Decision Records guidelines
- `docs/pdr/README.md` - Product Decision Records guidelines

## Project Overview

This is a **live video/audio streaming platform** built with:

- **Backend**: Express + tRPC + PostgreSQL (port 3000)
- **Frontend**: React 19 + Vite (port 5173)
- **UI/Styling**: Shadcn UI + Tailwind CSS v4 + Lucide Icons
- **Video**: Agora RTC SDK

## Design System Rules

1. **Always use Shadcn components** - Never create custom buttons, inputs, etc.
2. **Use Tailwind utilities** - No inline styles, no CSS modules
3. **Follow design tokens** - Use `bg-primary`, `text-foreground`, etc. (not `bg-blue-500`)
4. **Use the `cn()` utility** - For merging Tailwind classes
5. **Mobile-first responsive** - Use `md:` and `lg:` breakpoints
6. **Use Lucide icons** - Replace emojis with proper icons (`<Mic />`, `<Video />`, etc.)

## Component Structure

All UI components go in: `client/src/components/ui/ComponentName/`

```
ComponentName/
├── ComponentName.tsx
└── index.ts
```

## Dev-Quality Tracks

When creating technical improvement plans:

1. **Check `dev-quality/ARCHITECTURE.md`** first for structure and guidelines
2. **Create sequential tracks**: `00X-track-name/`
3. **Use the template** from ARCHITECTURE.md
4. **Break into phases**: Each phase = 1-4 hours of work
5. **Required files**: `summary.md` + `phase-N-{name}.md`
6. **Update status**: Keep `summary.md` current with progress
7. **Document decisions**: Explain "why" not just "what"

### Dev-Quality Track Structure

```
dev-quality/
├── ARCHITECTURE.md              # Guidelines (read this first!)
└── 00X-track-name/
    ├── summary.md               # Overview + progress tracking
    ├── phase-1-{name}.md        # Phase 1 details
    ├── phase-2-{name}.md        # Phase 2 details
    └── phase-N-{name}.md        # Phase N details
```

## Decision Records (ADR & PDR)

When discussing important architecture or product decisions, document them in the appropriate decision record.

### Architecture Decision Records (ADR)

**Location**: `docs/adr/`

**When to create**:

- ✅ Technical/architectural decisions (database choice, framework selection, API design)
- ✅ Performance, scalability, or security trade-offs
- ✅ Significant library or tool choices
- ✅ Infrastructure or deployment decisions

**Process**:

1. **Check `docs/adr/README.md`** for structure and template
2. **Create**: `docs/adr/XXX-decision-title.md` (sequential numbering)
3. **Follow template**: Context, Decision, Alternatives, Consequences, Implementation
4. **Update index**: Add entry to `docs/adr/README.md`

**Example ADRs**:

- "ADR-001: Agora RTC vs Twilio for live streaming"
- "ADR-002: RTMP Converter vs All-RTC architecture"
- "ADR-003: PostgreSQL schema design for channels"

### Product Decision Records (PDR)

**Location**: `docs/pdr/`

**When to create**:

- ✅ Product/functional decisions (feature selection, UX choices)
- ✅ Scope changes or feature rejections
- ✅ Business logic or workflow decisions
- ✅ User-facing behavior changes

**Process**:

1. **Check `docs/pdr/README.md`** for structure and existing PDRs
2. **Create**: `docs/pdr/XXX-decision-title.md` (sequential numbering)
3. **Follow template**: Context, Decision, Alternatives, Consequences, Success Metrics
4. **Update index**: Add entry to `docs/pdr/README.md`

**Example PDRs**:

- "PDR-001: Tech stack selection"
- "PDR-005: No blog in MVP"
- "PDR-006: Buyer HLS vs RTC viewing experience"

### ADR vs PDR Quick Guide

| Aspect       | ADR (Architecture)       | PDR (Product)           |
| ------------ | ------------------------ | ----------------------- |
| **Focus**    | Technical decisions      | Functional decisions    |
| **Audience** | Developers, architects   | Product, stakeholders   |
| **Examples** | PostgreSQL vs MongoDB    | Blog vs no blog         |
| **Criteria** | Performance, scalability | UX, business value, ROI |

**Note**: When in doubt, create a PDR. ADRs should be reserved for significant technical/architectural choices.

## Key Conventions

- **Server runs on port 3000** (`npm run dev`)
- **Client runs on port 5173** (`npm run dev:client`)
- **DO NOT run npm commands** without asking first (it can break the user's environment)
- **Check STYLING.md** before creating any UI components
- **Check dev-quality/ARCHITECTURE.md** before creating technical tracks
- **Use TypeScript** for all code
- **Follow the existing patterns** in the codebase

## When Creating Components

1. Check if a Shadcn component exists first
2. If yes, use it (see STYLING.md for usage)
3. If no, create it following Shadcn patterns
4. Update STYLING.md with the new component documentation
5. Add Lucide icons where appropriate

## When Creating Dev-Quality Tracks

1. Read `dev-quality/ARCHITECTURE.md` thoroughly
2. Find the next sequential number (001, 002, etc.)
3. Create directory: `dev-quality/00X-track-name/`
4. Use the template from ARCHITECTURE.md
5. Create `summary.md` with progress tracking table
6. Create phase files: `phase-1-{name}.md`, etc.
7. Include: Objective, Files to Update, Steps, Acceptance Criteria, Status

## Important

- The user has manually configured Tailwind and Shadcn
- Don't modify `index.css`, `tailwind.config.js`, or `vite.config.ts` without discussion
- Always maintain design consistency (reference STYLING.md)
- Dev-quality tracks should be pausable at any phase boundary

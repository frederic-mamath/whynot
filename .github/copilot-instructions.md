# GitHub Copilot Instructions for NotWhat Project

## Context Files

Always include these files in your context when working on this project:

- `STYLING.md` - Complete styling guide with Shadcn UI and Tailwind CSS conventions
- `ARCHITECTURE.md` - System architecture and project structure
- `README.md` - Project overview and setup instructions
- `dev-quality/ARCHITECTURE.md` - Dev-quality track structure and guidelines

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


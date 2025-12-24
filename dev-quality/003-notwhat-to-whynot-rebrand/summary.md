# NotWhat to WhyNot Rebranding - Summary

## Overview
Replace all occurrences of "notwhat" with "whynot" across the codebase, documentation, configuration, and database to complete the project rebranding.

## Goal
Achieve 100% consistent branding by replacing "notwhat" (old name) with "whynot" (new name) in all project files, database, and configuration.

## Motivation
- ✅ **Brand consistency**: Align codebase with the deployed domain (whynot.mamath.fr)
- ✅ **Clarity**: Avoid confusion between old and new project names
- ✅ **Professionalism**: Present a unified brand identity in all touchpoints
- ✅ **Discoverability**: Make the codebase match public-facing URLs and documentation

## Progress Tracking
| Phase | Description | Status | Estimated Time |
|-------|-------------|--------|----------------|
| Phase 1 | Configuration & Package Metadata | ⏳ Pending | 30 min |
| Phase 2 | Database Schema & Migrations | ⏳ Pending | 1 hour |
| Phase 3 | Source Code & Documentation | ⏳ Pending | 1.5 hours |
| Phase 4 | UI Text & User-Facing Content | ⏳ Pending | 1 hour |

## Components/Files Affected

### ⏳ Phase 1: Configuration & Package Metadata
- `package.json`
- `package-lock.json`
- `.env.example`
- `.env.staging`
- Database connection strings
- README.md project name

### ⏳ Phase 2: Database Schema & Migrations
- Database name in connection configs
- Create migration script if needed
- Update seed data (if any)

### ⏳ Phase 3: Source Code & Documentation
- Type definitions and interfaces
- Comments and documentation
- Feature documentation
- Dev-quality track references
- GitHub Copilot instructions

### ⏳ Phase 4: UI Text & User-Facing Content
- NavBar/Header components
- Page titles and meta tags
- Error messages
- Any user-facing text

## Risks & Considerations
- **Database migration**: Renaming the database requires downtime or careful migration
- **Environment variables**: Must update all deployment environments (.env files)
- **Git history**: Old references will remain in git history (expected)
- **External dependencies**: Check if any external services reference "notwhat"

## Success Criteria
- ✅ All files contain "whynot" instead of "notwhat"
- ✅ Application builds successfully
- ✅ All tests pass (if any)
- ✅ Database renamed or migration completed
- ✅ Local and staging environments updated
- ✅ No console errors or warnings related to naming

## Status
⏳ **NOT STARTED** - Ready for Phase 1

## Notes
- This is a low-risk refactoring that should not break functionality
- Each phase is designed to be completed independently
- Can be paused and resumed at any phase boundary
- Changes are primarily textual replacements

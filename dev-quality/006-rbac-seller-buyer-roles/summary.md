# RBAC: Seller & Buyer Roles - Summary

## Overview
Implement role-based access control (RBAC) to restrict channel creation to sellers only, while allowing all users to request seller status.

## Goal
Replace the current `user_shop_roles` table with a proper RBAC system using `roles` and `user_roles` tables, where:
- All users start with "BUYER" role by default
- Only users with activated "SELLER" role can create channels
- Users can request "SELLER" role via UI (requires admin approval in database)

## Motivation
- **Access Control**: Prevent all users from creating channels without proper authorization
- **Scalability**: Prepare for future role-based features and permissions
- **Audit Trail**: Track who activated each role and when
- **Flexibility**: Allow easy addition of new roles in the future
- **User Flow**: Provide clear path for users to become sellers

## Progress Tracking
| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Database Schema Migration | 📝 PLANNING |
| Phase 2 | Backend Repository & Logic | 📝 PLANNING |
| Phase 3 | Middleware & Access Control | 📝 PLANNING |
| Phase 4 | Frontend UI & Integration | 📝 PLANNING |

## Database Schema Changes

### New Tables
- **`roles`**: Stores available roles (BUYER, SELLER)
- **`user_roles`**: Tracks user role assignments with activation audit

### Removed Tables
- **`user_shop_roles`**: Will be replaced by new RBAC system

## Components/Files Affected

### ✅ Completed
None yet

### ⏳ Remaining

#### Database
- `migrations/008_create_roles_table.ts`
- `migrations/009_create_user_roles_table.ts`
- `migrations/010_migrate_user_shop_roles_to_rbac.ts`
- `migrations/011_drop_user_shop_roles.ts`

#### Backend (@features/roles)
- `features/roles/repository/role.repository.ts`
- `features/roles/repository/user-role.repository.ts`
- `features/roles/service/role.service.ts`
- `features/roles/router/role.router.ts`
- `features/roles/types/role.types.ts`

#### Backend (Channels)
- `src/routers/channel.ts` - Add seller role check
- Middleware for role verification

#### Frontend
- `client/src/components/NavBar/NavBar.tsx` - Add "Become a Seller" button
- `client/src/hooks/useUserRoles.ts` - Hook to fetch user roles
- `client/src/types/roles.ts` - Role type definitions

## Acceptance Criteria
- [ ] Database migration creates `roles` and `user_roles` tables
- [ ] All existing users receive "BUYER" role automatically
- [ ] Channel creation requires active "SELLER" role
- [ ] Users can request "SELLER" role via UI (creates pending user_role)
- [ ] Pending seller requests visible in navbar (disabled state when pending)
- [ ] Admin can activate seller role directly in database
- [ ] Audit trail tracks who activated roles and when
- [ ] Type-safe role checking throughout application

## Status
📝 **PLANNING** - Ready to begin implementation

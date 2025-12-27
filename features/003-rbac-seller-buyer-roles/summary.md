# RBAC Seller-Buyer Roles - Summary

## Overview
Refactor the user_shop_roles system into a general-purpose RBAC (Role-Based Access Control) system with BUYER and SELLER roles to control channel creation permissions.

## Goal
Replace shop-specific role system with platform-level roles (BUYER, SELLER) and restrict channel creation to users with active SELLER role.

## Motivation
- **Scalability**: Decouple roles from shops to enable platform-wide permissions
- **Access control**: Only verified sellers can create live channels
- **Audit trail**: Track who activated roles and when for compliance
- **Default safety**: All users start as BUYER, requiring explicit approval to become SELLER

## Progress Tracking
| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Create roles and user_roles tables with migration | ✅ |
| Phase 2 | Create repositories for roles and user_roles | ✅ |
| Phase 3 | Create role router and endpoints | ✅ |
| Phase 4 | Add role check to channel creation | ⏳ |
| Phase 5 | Add "Become a Seller" button to navbar | ✅ |
| Phase 6 | Seed default BUYER role for existing users | ✅ |

## Components/Files Affected

### ✅ Completed
- `migrations/008_create_roles.ts` - Create roles table with BUYER/SELLER
- `migrations/009_create_user_roles.ts` - Create user_roles table with activation tracking
- `src/db/types.ts` - Added Role and UserRole types
- `src/repositories/RoleRepository.ts` - Role repository with @Query methods
- `src/repositories/UserRoleRepository.ts` - UserRole repository with @Query methods
- `src/repositories/index.ts` - Export new repositories
- `src/routers/role.ts` - Role router with 3 endpoints (requestSellerRole, myRoles, hasRole)
- `src/routers/index.ts` - Export role router in appRouter

### ⏳ Remaining
- `src/routers/channel.ts` - Add SELLER role check
- `client/src/components/NavBar/NavBar.tsx` - Add "Become a Seller" button

## Database Schema Changes

### New Tables
**roles**
- id (serial, PK)
- name (varchar: 'BUYER', 'SELLER')
- created_at (timestamp)

**user_roles**
- id (serial, PK)
- user_id (int, FK → users.id)
- role_id (int, FK → roles.id)
- activated_by (int, FK → users.id, nullable)
- activated_at (timestamp, nullable)
- created_at (timestamp)

### Migration Strategy
- Create new tables alongside existing user_shop_roles
- user_shop_roles table remains untouched for shop-vendor relationships
- Default BUYER role created for all existing users

## Business Logic

1. **Default Behavior**: New users automatically receive BUYER role (activated)
2. **Seller Request**: Users can request SELLER role (activated_by = NULL, activated_at = NULL)
3. **Admin Activation**: Admin manually activates SELLER role in database
4. **Channel Creation**: Only users with active SELLER role can create channels

## Implementation Flow

### Phase 1: Database Migration (1-2h)
- Create `roles` table with BUYER/SELLER entries
- Create `user_roles` table with activation tracking
- Seed BUYER role for all existing users

### Phase 2: Repositories (2-3h)
- Add Role and UserRole types to Database interface
- Create RoleRepository with JPA-style @Query pattern
- Create UserRoleRepository with role checking methods

### Phase 3: Role Router (1-2h)
- Create tRPC role router with 3 endpoints
- requestSellerRole: Create pending SELLER request
- myRoles: Get user's active roles
- hasRole: Check specific role activation

### Phase 4: Channel Role Check (30min-1h)
- Add SELLER role check to channel creation endpoint
- Return 403 FORBIDDEN for non-sellers
- Guide users to request seller access

### Phase 5: NavBar Button (1-2h)
- Add "Become a Seller" button to desktop and mobile nav
- Show only for logged-in BUYER-only users
- Display "Pending" state for unactivated requests
- Hide for active SELLERS

### Phase 6: Auto-Assign BUYER (30min-1h)
- Update register endpoint to auto-assign BUYER role
- New users get activated BUYER role immediately
- Graceful fallback if role assignment fails

## Total Estimated Time
6-11 hours

## Business Impact

### Security & Control
- ✅ Platform controls who can create live channels
- ✅ Audit trail of who activated seller roles
- ✅ Default-deny: Users must request elevated permissions

### User Experience
- ✅ Clear path to becoming a seller
- ✅ Simple one-click request process
- ✅ Transparent pending state visible in UI
- ✅ Helpful error messages guide users

### Scalability
- ✅ Decouples roles from shops (platform-level)
- ✅ Easy to add more roles in the future (e.g., MODERATOR, ADMIN)
- ✅ Foundation for future permission system

## Admin Manual Activation

Until admin UI is built, activate SELLER requests manually:

```sql
-- View pending requests
SELECT u.id, u.email, ur.created_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'SELLER'
AND ur.activated_at IS NULL
ORDER BY ur.created_at DESC;

-- Activate a specific user's SELLER role
UPDATE user_roles ur
SET activated_by = YOUR_ADMIN_ID, activated_at = NOW()
WHERE ur.user_id = TARGET_USER_ID
AND ur.role_id = (SELECT id FROM roles WHERE name = 'SELLER');
```

## Status
Current overall status: 🟡 IN PROGRESS

**Next Action**: Begin Phase 4 - Add SELLER role check to channel creation (if not completed) or feature is complete

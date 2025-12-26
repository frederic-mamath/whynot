# RBAC Implementation - Quick Reference

## Admin Quick Actions

### Approve Seller Request
```sql
-- 1. Find pending requests
SELECT ur.id, u.email, ur.created_at
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'SELLER' AND ur.activated_at IS NULL;

-- 2. Activate (replace ? with user_role ID)
UPDATE user_roles 
SET activated_at = NOW(), activated_by = 1
WHERE id = ?;
```

### Grant Seller Role Directly
```sql
-- If user hasn't requested via UI
INSERT INTO user_roles (user_id, role_id, activated_at, activated_by)
VALUES (
  (SELECT id FROM users WHERE email = 'user@example.com'),
  (SELECT id FROM roles WHERE name = 'SELLER'),
  NOW(),
  1
);
```

### Check User's Roles
```sql
SELECT r.name, ur.activated_at, ur.created_at
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = (SELECT id FROM users WHERE email = 'user@example.com');
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     User Registration                    │
│                            ↓                             │
│              Auto-assign BUYER role (active)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 User Clicks "Become Seller"             │
│                            ↓                             │
│         Create user_role (activated_at = NULL)          │
│                            ↓                             │
│              Show "Seller Request Pending"              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Admin Approves in DB                   │
│        SET activated_at = NOW(), activated_by = 1       │
│                            ↓                             │
│                User becomes active SELLER               │
│                            ↓                             │
│               Can now create channels                   │
└─────────────────────────────────────────────────────────┘
```

## Key Files

### Backend
- `features/roles/repository/role.repository.ts` - Role queries
- `features/roles/repository/user-role.repository.ts` - User role queries
- `features/roles/service/role.service.ts` - Business logic
- `features/roles/router/role.router.ts` - tRPC API

### Frontend
- `client/src/hooks/useUserRoles.ts` - Role management hook
- `client/src/components/NavBar/NavBar.tsx` - Seller button UI

### Database
- `migrations/008_create_roles_table.ts`
- `migrations/009_create_user_roles_table.ts`
- `migrations/010_seed_default_roles.ts`
- `migrations/011_assign_buyer_role_to_users.ts`
- `migrations/012_drop_user_shop_roles.ts`

## User Flow

1. **New User Signup** → Auto BUYER role (active)
2. **User Requests Seller** → Creates pending user_role
3. **Admin Approves** → Sets activated_at
4. **User Creates Channel** → Role check passes ✅

## Role States

| State | activated_at | UI Display |
|-------|--------------|------------|
| Pending | `NULL` | "Seller Request Pending" (disabled) |
| Active | `NOT NULL` | "Seller" badge |
| None | No record | "Become a Seller" button |

## Phase Implementation Order

1. **Phase 1**: Database schema & migrations
2. **Phase 2**: Backend repositories & services
3. **Phase 3**: Frontend integration (navbar button)
4. **Phase 4**: Testing & documentation

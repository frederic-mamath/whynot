# Phase 2: Backend Repository & Service Layer

## Objective
Implement repository pattern and service layer for roles and user_roles in `@features/roles` directory, following the existing repository architecture.

## Files to Create

### Type Definitions
- `features/roles/types/role.types.ts` - Role and UserRole types

### Repositories
- `features/roles/repository/role.repository.ts` - Role data access
- `features/roles/repository/user-role.repository.ts` - UserRole data access

### Services
- `features/roles/service/role.service.ts` - Business logic for roles

### Router
- `features/roles/router/role.router.ts` - tRPC endpoints

### Index
- `features/roles/index.ts` - Feature exports

## Type Definitions

### `features/roles/types/role.types.ts`
```typescript
export const ROLE_NAMES = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

export interface Role {
  id: number;
  name: RoleName;
  description: string | null;
  created_at: Date;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  activated_by: number | null;
  activated_at: Date | null;
  created_at: Date;
}

export interface UserRoleWithDetails extends UserRole {
  role_name: RoleName;
  activated_by_email?: string | null;
}

export interface CreateUserRoleInput {
  user_id: number;
  role_name: RoleName;
  activated_by?: number | null;
  activated_at?: Date | null;
}

export interface ActivateUserRoleInput {
  user_role_id: number;
  activated_by: number;
}
```

## Repository Layer

### `RoleRepository`
**Methods**:
- `findByName(name: RoleName): Promise<Role | null>` - Find role by name
- `findAll(): Promise<Role[]>` - Get all roles
- `findById(id: number): Promise<Role | null>` - Get role by ID

### `UserRoleRepository`
**Methods**:
- `findByUserId(userId: number): Promise<UserRoleWithDetails[]>` - Get user's roles with details
- `findActiveByUserId(userId: number): Promise<UserRoleWithDetails[]>` - Get only activated roles
- `findPendingByUserId(userId: number): Promise<UserRoleWithDetails[]>` - Get pending roles
- `hasActiveRole(userId: number, roleName: RoleName): Promise<boolean>` - Check if user has active role
- `create(input: CreateUserRoleInput): Promise<UserRole>` - Request/assign role
- `activate(input: ActivateUserRoleInput): Promise<UserRole>` - Activate pending role
- `findById(id: number): Promise<UserRole | null>` - Get user_role by ID

## Service Layer

### `RoleService`
**Methods**:
- `getUserRoles(userId: number): Promise<UserRoleWithDetails[]>` - Get all user roles
- `hasRole(userId: number, roleName: RoleName): Promise<boolean>` - Check if user has active role
- `requestSellerRole(userId: number): Promise<UserRole>` - User requests seller role (pending)
- `activateSellerRole(userRoleId: number, activatedBy: number): Promise<UserRole>` - Admin activates
- `assignBuyerRole(userId: number): Promise<UserRole>` - Auto-assign buyer (for new users)

**Business Rules**:
- Cannot request role if already has it (active or pending)
- BUYER role auto-activates (activated_at = NOW(), activated_by = NULL)
- SELLER role requires admin approval (activated_at = NULL initially)
- Only system can assign BUYER role during registration

## Router (tRPC)

### `features/roles/router/role.router.ts`
**Endpoints**:
- `getMyRoles` - Get current user's roles (authenticated)
- `hasRole` - Check if current user has specific role (authenticated)
- `requestSellerRole` - Request seller role (authenticated)

**Protected Routes**:
All routes require authentication via middleware.

## Integration Points

### User Registration
Update user creation flow to automatically assign BUYER role:
- `src/routers/user.ts` (or user creation logic)
- Call `roleService.assignBuyerRole(newUserId)` after user created

### Channel Creation Protection
Add role check before allowing channel creation:
- `src/routers/channel.ts` in create channel endpoint
- Call `roleService.hasRole(userId, 'SELLER')` before proceeding
- Return error if user doesn't have active SELLER role

## Steps

1. **Create type definitions** (`types/role.types.ts`)
   - Define Role, UserRole, and related types
   - Export constants for role names

2. **Implement RoleRepository** (`repository/role.repository.ts`)
   - Use Kysely query builder
   - Follow existing repository patterns
   - Add SQL queries with model attribute support

3. **Implement UserRoleRepository** (`repository/user-role.repository.ts`)
   - Complex queries with JOINs for details
   - Activation logic
   - Uniqueness checks

4. **Implement RoleService** (`service/role.service.ts`)
   - Business logic and validation
   - Use repositories for data access
   - Handle role request and activation flows

5. **Create tRPC router** (`router/role.router.ts`)
   - Define endpoints
   - Connect to service layer
   - Add authentication middleware

6. **Create feature index** (`features/roles/index.ts`)
   - Export router
   - Export types for external use

7. **Register router** in main app router
   - Add to `src/routers/index.ts` or equivalent

8. **Update user creation** to assign BUYER role
   - Modify user registration endpoint

9. **Update channel creation** to check SELLER role
   - Add middleware or direct check

## Acceptance Criteria
- [ ] All repositories follow existing repository pattern
- [ ] Service layer implements all business rules correctly
- [ ] tRPC endpoints are properly authenticated
- [ ] User registration automatically assigns BUYER role
- [ ] Channel creation checks for active SELLER role
- [ ] Cannot request duplicate roles
- [ ] Seller requests create pending user_role (activated_at = NULL)
- [ ] Type safety across all layers
- [ ] Error messages are clear and user-friendly

## Testing Commands
```bash
# Build server to check types
npm run build:server

# Test in development
npm run dev
```

## Status
📝 **PLANNING** - Ready to implement after Phase 1

## Notes
- Follow same query builder pattern as existing repositories
- Ensure proper error handling for duplicate role requests
- Consider caching user roles for performance (future optimization)

# Phase 3: Create Role Router

## Objective
Create tRPC router with endpoint for users to request SELLER role.

## Estimated Time
1-2 hours

## Files to Create
- `src/routers/role.ts` - NEW
- `src/routers/index.ts` - Export role router

## Detailed Steps

### 1. Create role router
Create `src/routers/role.ts`:

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { roleRepository, userRoleRepository } from '../repositories';
import { TRPCError } from '@trpc/server';

export const roleRouter = router({
  /**
   * Request SELLER role
   * Creates a pending user_role entry (activated_by = NULL)
   */
  requestSellerRole: publicProcedure
    .mutation(async ({ ctx }) => {
      // Check authentication
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to request seller role',
        });
      }

      // Find SELLER role
      const sellerRole = await roleRepository.findByName('SELLER');
      if (!sellerRole) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'SELLER role not found in database',
        });
      }

      // Check if user already has SELLER role (active or pending)
      const existingRole = await userRoleRepository.findByUserIdAndRoleName(
        ctx.userId,
        'SELLER'
      );

      if (existingRole) {
        if (existingRole.activated_at) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You are already a seller',
          });
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Your seller request is pending approval',
          });
        }
      }

      // Create pending role request
      const roleRequest = await userRoleRepository.createUserRole({
        userId: ctx.userId,
        roleId: sellerRole.id,
        activatedBy: undefined,
        activatedAt: undefined,
      });

      return {
        success: true,
        message: 'Seller role request submitted. Awaiting admin approval.',
        roleRequest: {
          id: roleRequest.id,
          status: 'pending',
          createdAt: roleRequest.created_at,
        },
      };
    }),

  /**
   * Get current user's roles
   */
  myRoles: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      const activeRoles = await userRoleRepository.findActiveRolesByUserId(ctx.userId);

      return {
        roles: activeRoles.map(r => r.role_name),
        details: activeRoles,
      };
    }),

  /**
   * Check if user has a specific role
   */
  hasRole: publicProcedure
    .input(
      z.object({
        roleName: z.enum(['BUYER', 'SELLER']),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        return { hasRole: false };
      }

      const hasRole = await userRoleRepository.hasActiveRole(
        ctx.userId,
        input.roleName
      );

      return { hasRole };
    }),
});
```

### 2. Export role router
Update `src/routers/index.ts`:

```typescript
import { router } from '../trpc';
import { authRouter } from './auth';
import { channelRouter } from './channel';
import { roleRouter } from './role';
// ... other imports

export const appRouter = router({
  auth: authRouter,
  channel: channelRouter,
  role: roleRouter,
  // ... other routers
});

export type AppRouter = typeof appRouter;
```

## API Endpoints

### POST /trpc/role.requestSellerRole
**Description**: Request SELLER role (creates pending request)

**Auth**: Required

**Response**:
```json
{
  "success": true,
  "message": "Seller role request submitted. Awaiting admin approval.",
  "roleRequest": {
    "id": 123,
    "status": "pending",
    "createdAt": "2024-12-27T10:00:00Z"
  }
}
```

**Errors**:
- 401: Not authenticated
- 400: Already a seller OR request pending
- 500: SELLER role not found

### GET /trpc/role.myRoles
**Description**: Get current user's active roles

**Auth**: Required

**Response**:
```json
{
  "roles": ["BUYER", "SELLER"],
  "details": [
    {
      "id": 1,
      "user_id": 123,
      "role_id": 1,
      "role_name": "BUYER",
      "activated_by": 123,
      "activated_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /trpc/role.hasRole
**Description**: Check if user has specific role

**Auth**: Optional

**Input**:
```json
{
  "roleName": "SELLER"
}
```

**Response**:
```json
{
  "hasRole": true
}
```

## Acceptance Criteria
- [ ] Role router created with 3 endpoints
- [ ] requestSellerRole creates pending user_role
- [ ] requestSellerRole prevents duplicate requests
- [ ] requestSellerRole validates SELLER role exists
- [ ] myRoles returns user's active roles
- [ ] hasRole checks specific role activation
- [ ] All endpoints use repositories (no direct DB access)
- [ ] Proper error handling with appropriate status codes
- [ ] Router exported in appRouter

## Manual Testing
```typescript
// In client or API test tool:

// 1. Request SELLER role
const response = await trpc.role.requestSellerRole.mutate();
// Expected: { success: true, message: "...", roleRequest: {...} }

// 2. Try requesting again
const response2 = await trpc.role.requestSellerRole.mutate();
// Expected: Error "Your seller request is pending approval"

// 3. Get my roles
const roles = await trpc.role.myRoles.query();
// Expected: { roles: ["BUYER"], details: [...] }

// 4. Check has SELLER role
const hasSeller = await trpc.role.hasRole.query({ roleName: 'SELLER' });
// Expected: { hasRole: false }

// 5. Manually activate in DB:
// UPDATE user_roles SET activated_by = 1, activated_at = NOW() WHERE user_id = X AND role_id = 2;

// 6. Check again
const hasSeller2 = await trpc.role.hasRole.query({ roleName: 'SELLER' });
// Expected: { hasRole: true }
```

## Status
⏳ NOT STARTED

# Phase 6: Seed BUYER Role for New Users

## Objective
Automatically assign BUYER role to new users upon registration.

## Estimated Time
30 minutes - 1 hour

## Files to Update
- `src/routers/auth.ts` - Add BUYER role assignment after user creation

## Detailed Steps

### 1. Update auth router register endpoint
Edit `src/routers/auth.ts`:

**Find the register mutation** (should look similar to this):

```typescript
register: publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await userRepository.save({
      email: input.email,
      password: hashedPassword,
      first_name: input.firstName,
      last_name: input.lastName,
    });

    // Generate JWT
    const token = generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }),
```

**Add BUYER role assignment** after user creation:

```typescript
import { roleRepository, userRoleRepository } from '../repositories';

register: publicProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await userRepository.save({
      email: input.email,
      password: hashedPassword,
      first_name: input.firstName,
      last_name: input.lastName,
    });

    // Assign default BUYER role
    try {
      const buyerRole = await roleRepository.findByName('BUYER');
      if (buyerRole) {
        await userRoleRepository.createUserRole({
          userId: user.id,
          roleId: buyerRole.id,
          activatedBy: user.id, // Self-activated
          activatedAt: new Date(),
        });
      }
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to assign BUYER role to new user:', error);
    }

    // Generate JWT
    const token = generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }),
```

### 2. Add imports
At the top of `src/routers/auth.ts`:

```typescript
import { userRepository, roleRepository, userRoleRepository } from '../repositories';
```

## Code Changes Summary

**File**: `src/routers/auth.ts`

**Lines to add** (after user creation, before token generation):

```typescript
    // Assign default BUYER role
    try {
      const buyerRole = await roleRepository.findByName('BUYER');
      if (buyerRole) {
        await userRoleRepository.createUserRole({
          userId: user.id,
          roleId: buyerRole.id,
          activatedBy: user.id, // Self-activated
          activatedAt: new Date(),
        });
      }
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to assign BUYER role to new user:', error);
    }
```

**Import to update**:

```typescript
import { userRepository, roleRepository, userRoleRepository } from '../repositories';
```

## Design Decisions

### Why try-catch?
- User registration should succeed even if role assignment fails
- Prevents registration blocking due to missing BUYER role in DB
- Logs error for debugging
- User can still use the platform (will be restricted from creating channels)

### Why self-activated?
- BUYER role is default and doesn't require admin approval
- `activated_by = user.id` indicates user automatically received this role
- `activated_at = NOW()` makes role immediately active

### Why not in migration?
- Migration handles **existing** users
- This handles **future** users
- Both are necessary for complete coverage

## Acceptance Criteria
- [ ] New user registration creates user_role with BUYER role
- [ ] BUYER role is activated (activated_at IS NOT NULL)
- [ ] activated_by = user.id (self-activated)
- [ ] Registration succeeds even if BUYER role doesn't exist
- [ ] Error logged if role assignment fails
- [ ] Repositories imported correctly
- [ ] No breaking changes to registration flow

## Testing Scenarios

### Test 1: Normal registration
```bash
# Register new user
POST /trpc/auth.register
{
  "email": "newuser@test.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User"
}

# Expected: 
# - User created
# - Token returned
# - Check DB: user_roles has entry for new user with BUYER role
```

Validation SQL:
```sql
SELECT u.id, u.email, r.name, ur.activated_at, ur.activated_by
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'newuser@test.com';

-- Expected result:
-- | id | email              | name  | activated_at        | activated_by |
-- |----|-----------------------|-------|----------------------|--------------|
-- | 5  | newuser@test.com  | BUYER | 2024-12-27 10:00:00 | 5            |
```

### Test 2: Registration with missing BUYER role
```sql
-- Simulate missing BUYER role
DELETE FROM roles WHERE name = 'BUYER';
```

```bash
# Register new user
POST /trpc/auth.register
{
  "email": "test2@test.com",
  "password": "password123"
}

# Expected:
# - User still created
# - Token returned
# - Console shows error log
# - No user_role created
```

### Test 3: Multiple registrations
```bash
# Register 3 users
POST /trpc/auth.register { "email": "user1@test.com", ... }
POST /trpc/auth.register { "email": "user2@test.com", ... }
POST /trpc/auth.register { "email": "user3@test.com", ... }

# Check DB: All 3 have BUYER role
```

Validation SQL:
```sql
SELECT COUNT(*) as buyer_count
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'BUYER'
AND ur.activated_at IS NOT NULL;

-- Should match number of users
```

## Integration Points

This phase completes the RBAC system:

1. **Phase 1**: Created tables and seeded roles for existing users ✅
2. **Phase 2**: Created repositories for data access ✅
3. **Phase 3**: Created API endpoints for role management ✅
4. **Phase 4**: Restricted channel creation to SELLER role ✅
5. **Phase 5**: Added UI for requesting SELLER role ✅
6. **Phase 6**: Auto-assign BUYER to new users ✅ (this phase)

## Final Validation

After completing all phases, test the complete flow:

1. **New user registration**:
   - Register → Automatically has BUYER role
   - Try to create channel → 403 Forbidden
   - Request SELLER role → Pending request created
   - Admin activates → Can create channels

2. **Existing user**:
   - Login → Already has BUYER role (from migration)
   - Request SELLER role → Works
   - Get activated → Can create channels

3. **Database consistency**:
```sql
-- All users should have at least BUYER role
SELECT u.id, u.email
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id AND r.name = 'BUYER'
WHERE r.id IS NULL;

-- Should return 0 rows
```

## Rollback Plan

If issues arise:

```typescript
// Comment out role assignment in auth.ts
// try {
//   const buyerRole = await roleRepository.findByName('BUYER');
//   if (buyerRole) {
//     await userRoleRepository.createUserRole({...});
//   }
// } catch (error) {
//   console.error('Failed to assign BUYER role to new user:', error);
// }
```

Or manually fix users without BUYER role:
```sql
INSERT INTO user_roles (user_id, role_id, activated_by, activated_at)
SELECT 
  u.id,
  (SELECT id FROM roles WHERE name = 'BUYER'),
  u.id,
  NOW()
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = u.id AND r.name = 'BUYER'
);
```

## Status
⏳ NOT STARTED

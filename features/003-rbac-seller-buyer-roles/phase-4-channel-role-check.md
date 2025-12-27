# Phase 4: Add Role Check to Channel Creation

## Objective
Restrict channel creation to users with active SELLER role.

## Estimated Time
30 minutes - 1 hour

## Files to Update
- `src/routers/channel.ts` - Add SELLER role check

## Detailed Steps

### 1. Update channel creation endpoint
Edit `src/routers/channel.ts` - modify the `create` mutation:

**Before**:
```typescript
create: publicProcedure
  .input(
    z.object({
      name: z.string().min(3, 'Name must be at least 3 characters').max(100),
      maxParticipants: z.number().min(2).max(50).default(10),
      isPrivate: z.boolean().default(false),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check authentication
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to create a channel',
      });
    }

    // Create channel using repository
    const channel = await channelRepository.save({
      // ...
    });
```

**After**:
```typescript
import { userRoleRepository } from '../repositories';

create: publicProcedure
  .input(
    z.object({
      name: z.string().min(3, 'Name must be at least 3 characters').max(100),
      maxParticipants: z.number().min(2).max(50).default(10),
      isPrivate: z.boolean().default(false),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Check authentication
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to create a channel',
      });
    }

    // Check if user has active SELLER role
    const isSeller = await userRoleRepository.hasActiveRole(ctx.userId, 'SELLER');
    
    if (!isSeller) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only sellers can create channels. Please request seller access.',
      });
    }

    // Create channel using repository
    const channel = await channelRepository.save({
      // ...
    });
```

### 2. Import userRoleRepository
Add to imports at top of file:

```typescript
import { channelRepository, channelParticipantRepository, userRoleRepository } from '../repositories';
```

## Code Changes Summary

**File**: `src/routers/channel.ts`

**Lines to add** (after authentication check, around line 28):

```typescript
    // Check if user has active SELLER role
    const isSeller = await userRoleRepository.hasActiveRole(ctx.userId, 'SELLER');
    
    if (!isSeller) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only sellers can create channels. Please request seller access.',
      });
    }
```

**Import to add** (line 3):

```typescript
import { channelRepository, channelParticipantRepository, userRoleRepository } from '../repositories';
```

## Acceptance Criteria
- [ ] Channel creation requires active SELLER role
- [ ] Users without SELLER role receive 403 FORBIDDEN error
- [ ] Error message guides users to request seller access
- [ ] Existing sellers can still create channels
- [ ] BUYER-only users cannot create channels
- [ ] No other channel endpoints are affected

## Testing Scenarios

### Test 1: User with only BUYER role
```typescript
// User: BUYER role only
// Action: Try to create channel
// Expected: 403 Error "Only sellers can create channels..."
```

### Test 2: User with pending SELLER request
```typescript
// User: BUYER + pending SELLER (activated_at = NULL)
// Action: Try to create channel
// Expected: 403 Error "Only sellers can create channels..."
```

### Test 3: User with active SELLER role
```typescript
// User: BUYER + SELLER (activated_at IS NOT NULL)
// Action: Try to create channel
// Expected: 200 Success, channel created
```

### Test 4: Not logged in
```typescript
// User: Not authenticated
// Action: Try to create channel
// Expected: 401 Error "You must be logged in..."
```

## Manual Testing Steps

1. **Setup**: Ensure you have a user with only BUYER role
```sql
-- Check user roles
SELECT u.id, u.email, r.name, ur.activated_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = YOUR_USER_ID;
```

2. **Test BUYER restriction**:
   - Login as BUYER-only user
   - Navigate to `/create-channel`
   - Fill form and submit
   - Verify error: "Only sellers can create channels..."

3. **Activate SELLER role**:
```sql
-- Get SELLER role id
SELECT id FROM roles WHERE name = 'SELLER';

-- Insert user_role for your user
INSERT INTO user_roles (user_id, role_id, activated_by, activated_at)
VALUES (YOUR_USER_ID, SELLER_ROLE_ID, YOUR_USER_ID, NOW());
```

4. **Test SELLER success**:
   - Refresh page
   - Fill form and submit
   - Verify channel created successfully

5. **Verify other endpoints unaffected**:
   - Join channel (should work for BUYER)
   - List channels (should work for BUYER)
   - Leave channel (should work for BUYER)

## Rollback Plan
If issues arise:

1. Comment out the role check:
```typescript
// Temporarily disabled role check
// const isSeller = await userRoleRepository.hasActiveRole(ctx.userId, 'SELLER');
// if (!isSeller) {
//   throw new TRPCError({...});
// }
```

2. Or revert the commit:
```bash
git revert HEAD
```

## Status
⏳ NOT STARTED

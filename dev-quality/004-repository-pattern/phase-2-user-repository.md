# Phase 2: User & Auth Repository

## Objective
Create UserRepository to handle all user-related database operations, then refactor the auth router to use it.

## Current State Analysis

The `auth.ts` router currently has these database operations:
1. Find user by email (login)
2. Create new user (register)
3. Find user by ID (me endpoint)

All these queries are mixed with business logic in the router.

## Repository to Create

### `src/repositories/UserRepository.ts`

```typescript
import { BaseRepository } from './base/BaseRepository';
import { UsersTable, User } from '../db/types';
import { db } from '../db';

/**
 * Repository for User entity
 * Handles all user-related database operations
 */
export class UserRepository extends BaseRepository<UsersTable, 'users'> {
  constructor() {
    super('users');
  }

  /**
   * Find user by email (for authentication)
   * @param email User email address
   * @returns User object or undefined
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  /**
   * Find user by ID (already in BaseRepository, but documented here)
   * Inherited from BaseRepository: findById(id)
   */

  /**
   * Create new user
   * @param email User email
   * @param hashedPassword Bcrypt hashed password
   * @param firstName Optional first name
   * @param lastName Optional last name
   * @returns Created user object
   */
  async createUser(
    email: string,
    hashedPassword: string,
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    return db
      .insertInto('users')
      .values({
        email,
        password: hashedPassword,
        firstname: firstName || null,
        lastname: lastName || null,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Check if email already exists
   * @param email Email to check
   * @returns true if email exists, false otherwise
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', email)
      .executeTakeFirst();
    
    return result !== undefined;
  }

  /**
   * Update user verification status
   * @param userId User ID
   * @param isVerified Verification status
   */
  async updateVerificationStatus(
    userId: number,
    isVerified: boolean
  ): Promise<User | undefined> {
    return db
      .updateTable('users')
      .set({
        is_verified: isVerified,
        updated_at: new Date(),
      })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Update user profile
   * @param userId User ID
   * @param data Profile data to update
   */
  async updateProfile(
    userId: number,
    data: {
      firstname?: string | null;
      lastname?: string | null;
    }
  ): Promise<User | undefined> {
    return db
      .updateTable('users')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
```

## Router Refactoring

### Before (auth.ts - current):
```typescript
export const authRouter = router({
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
    .mutation(async ({ input }) => {
      // Check if user exists
      const existingUser = await db
        .selectFrom('users')
        .select(['id'])
        .where('email', '=', input.email)
        .executeTakeFirst();
      
      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const user = await db
        .insertInto('users')
        .values({
          email: input.email,
          password: hashedPassword,
          firstname: input.firstName ?? null,
          lastname: input.lastName ?? null,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Generate token
      const token = generateToken(user.id);
      
      return {
        user: mapUserToUserOutboundDto(user),
        token,
      };
    }),
});
```

### After (with repository):
```typescript
import { userRepository } from '../repositories';

export const authRouter = router({
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
    .mutation(async ({ input }) => {
      // Check if email exists
      const emailExists = await userRepository.emailExists(input.email);
      if (emailExists) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user via repository
      const user = await userRepository.createUser(
        input.email,
        hashedPassword,
        input.firstName,
        input.lastName
      );

      // Generate token
      const token = generateToken(user.id);
      
      return {
        user: mapUserToUserOutboundDto(user),
        token,
      };
    }),
});
```

## Implementation Steps

### Step 1: Create UserRepository
```bash
touch src/repositories/UserRepository.ts
```

### Step 2: Implement Repository Methods
- Extend BaseRepository
- Implement `findByEmail()`
- Implement `createUser()`
- Implement `emailExists()`
- Implement `updateVerificationStatus()`
- Implement `updateProfile()`

### Step 3: Export Repository
Update `src/repositories/index.ts`:
```typescript
export { userRepository } from './UserRepository';
```

### Step 4: Refactor auth.ts Router
- Import `userRepository`
- Replace all `db.selectFrom('users')` with repository calls
- Replace `db.insertInto('users')` with `createUser()`
- Replace `db.updateTable('users')` with repository methods

### Step 5: Test Changes
- Run server build: `npm run build:server`
- Manually test:
  - Register new user
  - Login with credentials
  - Get current user (me endpoint)
- Verify all functionality works as before

## Files to Modify

### New File:
- `src/repositories/UserRepository.ts`

### Modified Files:
- `src/repositories/index.ts` - Add export
- `src/routers/auth.ts` - Replace database calls with repository

## Benefits After Refactoring

### Router becomes cleaner:
- ✅ No SQL queries visible
- ✅ Clear business logic flow
- ✅ Easy to understand at a glance
- ✅ Easier to test (mock repository)

### Repository provides:
- ✅ Centralized user data access
- ✅ Reusable query methods
- ✅ Single source of truth
- ✅ Easy to add new user queries

## Validation Checklist

- [ ] UserRepository class created
- [ ] All methods properly typed
- [ ] Methods documented with JSDoc
- [ ] Repository exported from index.ts
- [ ] auth.ts refactored to use repository
- [ ] No direct database calls in auth.ts
- [ ] Server builds without errors
- [ ] Register endpoint works
- [ ] Login endpoint works
- [ ] Me endpoint works
- [ ] All tests pass (if any)

## Acceptance Criteria

- ✅ UserRepository fully implemented
- ✅ All user database operations in repository
- ✅ auth.ts router uses repository exclusively
- ✅ No database queries in auth router
- ✅ All authentication flows work correctly
- ✅ Code is more readable and maintainable

## Estimated Time
**2 hours**

## Status
⏳ **PENDING** (Requires Phase 1 completion)

## Notes
- This is the first "real" repository implementation
- Serves as a template for other repositories
- Focus on clarity and documentation
- Test thoroughly before moving to next phase

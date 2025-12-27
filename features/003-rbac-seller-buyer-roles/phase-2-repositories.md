# Phase 2: Create Repositories

## Objective
Create RoleRepository and UserRoleRepository using the JPA-style @Query pattern with named methods and SQL queries that support model attributes.

## Estimated Time
2-3 hours

## Files to Create
- `src/db/types.ts` - Add Role and UserRole types
- `src/repositories/RoleRepository.ts` - NEW
- `src/repositories/UserRoleRepository.ts` - NEW
- `src/repositories/index.ts` - Export new repositories

## Detailed Steps

### 1. Add database types
Update `src/db/types.ts`:

```typescript
export interface Role {
  id: number;
  name: 'BUYER' | 'SELLER';
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

export interface Database {
  // ... existing tables
  roles: Role;
  user_roles: UserRole;
}
```

### 2. Create RoleRepository
Create `src/repositories/RoleRepository.ts`:

```typescript
import { db } from '../db';
import { Role } from '../db/types';

export class RoleRepository {
  /**
   * @Query SELECT * FROM roles WHERE name = :name
   */
  async findByName(name: 'BUYER' | 'SELLER'): Promise<Role | undefined> {
    return await db
      .selectFrom('roles')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
  }

  /**
   * @Query SELECT * FROM roles WHERE id = :id
   */
  async findById(id: number): Promise<Role | undefined> {
    return await db
      .selectFrom('roles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * @Query SELECT * FROM roles
   */
  async findAll(): Promise<Role[]> {
    return await db
      .selectFrom('roles')
      .selectAll()
      .execute();
  }
}

export const roleRepository = new RoleRepository();
```

### 3. Create UserRoleRepository
Create `src/repositories/UserRoleRepository.ts`:

```typescript
import { db } from '../db';
import { UserRole } from '../db/types';
import { sql } from 'kysely';

export class UserRoleRepository {
  /**
   * @Query SELECT ur.* FROM user_roles ur
   *        JOIN roles r ON ur.role_id = r.id
   *        WHERE ur.user_id = :userId 
   *        AND r.name = :roleName
   *        AND ur.activated_at IS NOT NULL
   */
  async hasActiveRole(userId: number, roleName: 'BUYER' | 'SELLER'): Promise<boolean> {
    const result = await db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'ur.role_id', 'r.id')
      .select('ur.id')
      .where('ur.user_id', '=', userId)
      .where('r.name', '=', roleName)
      .where('ur.activated_at', 'is not', null)
      .executeTakeFirst();

    return !!result;
  }

  /**
   * @Query SELECT ur.*, r.name as role_name 
   *        FROM user_roles ur
   *        JOIN roles r ON ur.role_id = r.id
   *        WHERE ur.user_id = :userId
   *        AND ur.activated_at IS NOT NULL
   */
  async findActiveRolesByUserId(userId: number): Promise<Array<UserRole & { role_name: string }>> {
    return await db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'ur.role_id', 'r.id')
      .select([
        'ur.id',
        'ur.user_id',
        'ur.role_id',
        'ur.activated_by',
        'ur.activated_at',
        'ur.created_at',
        'r.name as role_name',
      ])
      .where('ur.user_id', '=', userId)
      .where('ur.activated_at', 'is not', null)
      .execute();
  }

  /**
   * @Query SELECT ur.* FROM user_roles ur
   *        JOIN roles r ON ur.role_id = r.id
   *        WHERE ur.user_id = :userId 
   *        AND r.name = :roleName
   */
  async findByUserIdAndRoleName(
    userId: number,
    roleName: 'BUYER' | 'SELLER'
  ): Promise<UserRole | undefined> {
    return await db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'ur.role_id', 'r.id')
      .selectAll('ur')
      .where('ur.user_id', '=', userId)
      .where('r.name', '=', roleName)
      .executeTakeFirst();
  }

  /**
   * @Query INSERT INTO user_roles (user_id, role_id, activated_by, activated_at)
   *        VALUES (:userId, :roleId, :activatedBy, :activatedAt)
   */
  async createUserRole(data: {
    userId: number;
    roleId: number;
    activatedBy?: number;
    activatedAt?: Date;
  }): Promise<UserRole> {
    return await db
      .insertInto('user_roles')
      .values({
        user_id: data.userId,
        role_id: data.roleId,
        activated_by: data.activatedBy ?? null,
        activated_at: data.activatedAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * @Query UPDATE user_roles 
   *        SET activated_by = :activatedBy, activated_at = :activatedAt
   *        WHERE id = :id
   */
  async activateUserRole(id: number, activatedBy: number): Promise<UserRole> {
    return await db
      .updateTable('user_roles')
      .set({
        activated_by: activatedBy,
        activated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * @Query SELECT ur.* FROM user_roles ur
   *        WHERE ur.activated_at IS NULL
   *        ORDER BY ur.created_at DESC
   */
  async findPendingRequests(): Promise<UserRole[]> {
    return await db
      .selectFrom('user_roles')
      .selectAll()
      .where('activated_at', 'is', null)
      .orderBy('created_at', 'desc')
      .execute();
  }
}

export const userRoleRepository = new UserRoleRepository();
```

### 4. Export repositories
Update `src/repositories/index.ts`:

```typescript
export * from './UserRepository';
export * from './ChannelRepository';
export * from './ChannelParticipantRepository';
export * from './RoleRepository';
export * from './UserRoleRepository';
```

## Acceptance Criteria
- [ ] Role and UserRole types added to Database interface
- [ ] RoleRepository created with findByName, findById, findAll methods
- [ ] UserRoleRepository created with all required methods:
  - [ ] hasActiveRole - Check if user has active role
  - [ ] findActiveRolesByUserId - Get all active roles for user
  - [ ] findByUserIdAndRoleName - Find specific user role
  - [ ] createUserRole - Create new user role assignment
  - [ ] activateUserRole - Activate pending role request
  - [ ] findPendingRequests - List all pending role requests
- [ ] All methods use Kysely type-safe queries
- [ ] @Query comments document SQL intent
- [ ] Repositories exported from index.ts

## Testing
```typescript
// Manual test after implementation
import { roleRepository, userRoleRepository } from './repositories';

// Test finding roles
const buyerRole = await roleRepository.findByName('BUYER');
console.log('BUYER role:', buyerRole);

// Test checking active role
const hasRole = await userRoleRepository.hasActiveRole(1, 'BUYER');
console.log('User 1 has BUYER role:', hasRole);

// Test creating role request
const sellerRole = await roleRepository.findByName('SELLER');
const roleRequest = await userRoleRepository.createUserRole({
  userId: 1,
  roleId: sellerRole!.id,
});
console.log('Created role request:', roleRequest);
```

## Status
⏳ NOT STARTED

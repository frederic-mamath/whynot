# Phase 3: Shop Repository

## Objective
Create ShopRepository and UserShopRoleRepository to handle all shop-related database operations, then refactor the shop router.

## Current State Analysis

The `shop.ts` router currently handles:
1. Create shop (with owner role assignment)
2. List shops for user (with roles)
3. Get shop by ID
4. Update shop
5. Delete shop
6. Manage vendors (add/remove)
7. Check shop ownership/access

Currently ~150 lines with lots of database queries mixed with business logic.

## Repositories to Create

### 1. `src/repositories/ShopRepository.ts`

```typescript
import { BaseRepository } from './base/BaseRepository';
import { ShopsTable, Shop } from '../db/types';
import { db } from '../db';

/**
 * Repository for Shop entity
 * Handles all shop-related database operations
 */
export class ShopRepository extends BaseRepository<ShopsTable, 'shops'> {
  constructor() {
    super('shops');
  }

  /**
   * Find shops owned by a specific user
   * @param userId Owner user ID
   * @returns Array of shops
   */
  async findByOwnerId(userId: number): Promise<Shop[]> {
    return db
      .selectFrom('shops')
      .selectAll()
      .where('owner_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /**
   * Find shops where user has any role (owner or vendor)
   * Includes the role information
   */
  async findByUserWithRole(userId: number): Promise<Array<Shop & { role: 'shop-owner' | 'vendor' }>> {
    return db
      .selectFrom('shops')
      .innerJoin('user_shop_roles', 'user_shop_roles.shop_id', 'shops.id')
      .select([
        'shops.id',
        'shops.name',
        'shops.description',
        'shops.owner_id',
        'shops.created_at',
        'shops.updated_at',
        'user_shop_roles.role',
      ])
      .where('user_shop_roles.user_id', '=', userId)
      .execute() as Promise<Array<Shop & { role: 'shop-owner' | 'vendor' }>>;
  }

  /**
   * Create shop with automatic timestamp management
   * (inherited from BaseRepository but overridden for clarity)
   */
  async createShop(data: {
    name: string;
    description: string | null;
    owner_id: number;
  }): Promise<Shop> {
    return this.create(data);
  }

  /**
   * Check if shop exists
   * (inherited from BaseRepository)
   */
  // exists(id: number): Promise<boolean>

  /**
   * Update shop details
   */
  async updateShop(
    shopId: number,
    data: {
      name?: string;
      description?: string | null;
    }
  ): Promise<Shop | undefined> {
    return this.update(shopId, data);
  }
}

// Export singleton instance
export const shopRepository = new ShopRepository();
```

### 2. `src/repositories/UserShopRoleRepository.ts`

```typescript
import { db } from '../db';
import { UserShopRole } from '../db/types';

/**
 * Repository for UserShopRole entity
 * Handles shop role assignments and permissions
 */
export class UserShopRoleRepository {
  /**
   * Assign role to user in shop
   * @param userId User ID
   * @param shopId Shop ID
   * @param role Role type ('shop-owner' or 'vendor')
   */
  async assignRole(
    userId: number,
    shopId: number,
    role: 'shop-owner' | 'vendor'
  ): Promise<UserShopRole> {
    return db
      .insertInto('user_shop_roles')
      .values({
        user_id: userId,
        shop_id: shopId,
        role,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get user's role in a shop
   * @param userId User ID
   * @param shopId Shop ID
   * @returns Role object or undefined if user has no role
   */
  async getUserRole(
    userId: number,
    shopId: number
  ): Promise<UserShopRole | undefined> {
    return db
      .selectFrom('user_shop_roles')
      .selectAll()
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
  }

  /**
   * Check if user is shop owner
   * @param userId User ID
   * @param shopId Shop ID
   */
  async isShopOwner(userId: number, shopId: number): Promise<boolean> {
    const role = await db
      .selectFrom('user_shop_roles')
      .select(['role'])
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .where('role', '=', 'shop-owner')
      .executeTakeFirst();
    
    return role !== undefined;
  }

  /**
   * Check if user has any access to shop (owner or vendor)
   * @param userId User ID
   * @param shopId Shop ID
   */
  async hasShopAccess(userId: number, shopId: number): Promise<boolean> {
    const role = await this.getUserRole(userId, shopId);
    return role !== undefined;
  }

  /**
   * Find all users in a shop with their roles
   * @param shopId Shop ID
   */
  async findUsersByShop(shopId: number): Promise<UserShopRole[]> {
    return db
      .selectFrom('user_shop_roles')
      .selectAll()
      .where('shop_id', '=', shopId)
      .execute();
  }

  /**
   * Remove user's role from shop
   * @param userId User ID
   * @param shopId Shop ID
   */
  async removeRole(userId: number, shopId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('user_shop_roles')
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Find all vendors for a shop
   * @param shopId Shop ID
   */
  async findVendorsByShop(shopId: number): Promise<UserShopRole[]> {
    return db
      .selectFrom('user_shop_roles')
      .selectAll()
      .where('shop_id', '=', shopId)
      .where('role', '=', 'vendor')
      .execute();
  }
}

// Export singleton instance
export const userShopRoleRepository = new UserShopRoleRepository();
```

## Router Refactoring

### Before (shop.ts - current):
```typescript
create: protectedProcedure.mutation(async ({ ctx, input }) => {
  const shopData = mapCreateShopInboundDtoToShop(input, ctx.user.id);
  
  const shop = await db
    .insertInto("shops")
    .values({
      name: shopData.name,
      description: shopData.description,
      owner_id: shopData.owner_id,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  await db
    .insertInto("user_shop_roles")
    .values({
      user_id: ctx.user.id,
      shop_id: shop.id,
      role: "shop-owner",
      created_at: new Date(),
    })
    .execute();

  return mapShopToShopOutboundDto(shop);
}),
```

### After (with repositories):
```typescript
import { shopRepository, userShopRoleRepository } from '../repositories';

create: protectedProcedure.mutation(async ({ ctx, input }) => {
  const shopData = mapCreateShopInboundDtoToShop(input, ctx.user.id);
  
  // Create shop
  const shop = await shopRepository.createShop(shopData);

  // Assign owner role
  await userShopRoleRepository.assignRole(ctx.user.id, shop.id, 'shop-owner');

  return mapShopToShopOutboundDto(shop);
}),
```

## Middleware Refactoring

Update `src/middleware/shopOwner.ts` to use repositories:

### Before:
```typescript
export async function requireShopOwner(ctx: Context, shopId: number): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }

  const role = await db
    .selectFrom('user_shop_roles')
    .select(['role'])
    .where('user_id', '=', ctx.user.id)
    .where('shop_id', '=', shopId)
    .where('role', '=', 'shop-owner')
    .executeTakeFirst();

  if (!role) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Only shop owners can perform this action' });
  }
}
```

### After:
```typescript
import { userShopRoleRepository } from '../repositories';

export async function requireShopOwner(ctx: Context, shopId: number): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }

  const isOwner = await userShopRoleRepository.isShopOwner(ctx.user.id, shopId);
  
  if (!isOwner) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Only shop owners can perform this action' });
  }
}

export async function requireShopAccess(ctx: Context, shopId: number): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in' });
  }

  const hasAccess = await userShopRoleRepository.hasShopAccess(ctx.user.id, shopId);
  
  if (!hasAccess) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this shop' });
  }
}
```

## Implementation Steps

### Step 1: Create ShopRepository
```bash
touch src/repositories/ShopRepository.ts
```

### Step 2: Create UserShopRoleRepository
```bash
touch src/repositories/UserShopRoleRepository.ts
```

### Step 3: Export Repositories
Update `src/repositories/index.ts`:
```typescript
export { shopRepository } from './ShopRepository';
export { userShopRoleRepository } from './UserShopRoleRepository';
```

### Step 4: Refactor shop.ts Router
- Import both repositories
- Replace all shop database queries
- Replace all role management queries

### Step 5: Refactor shopOwner.ts Middleware
- Import userShopRoleRepository
- Replace permission check queries

### Step 6: Test All Shop Operations
- Create shop
- List shops
- Get shop details
- Update shop
- Delete shop
- Add vendor
- Remove vendor
- Permission checks

## Files to Modify

### New Files:
- `src/repositories/ShopRepository.ts`
- `src/repositories/UserShopRoleRepository.ts`

### Modified Files:
- `src/repositories/index.ts` - Add exports
- `src/routers/shop.ts` - Replace database calls
- `src/middleware/shopOwner.ts` - Replace permission queries

## Benefits

### Before:
- ❌ Permission checks scattered across files
- ❌ Shop queries duplicated in router
- ❌ Hard to understand role logic
- ❌ ~150 lines of mixed code

### After:
- ✅ Clear permission methods: `isShopOwner()`, `hasShopAccess()`
- ✅ Centralized role management
- ✅ Router ~50% smaller
- ✅ Easy to add new role types
- ✅ Testable permission logic

## Validation Checklist

- [ ] ShopRepository created and fully typed
- [ ] UserShopRoleRepository created
- [ ] Both exported from index.ts
- [ ] shop.ts refactored
- [ ] shopOwner.ts middleware refactored
- [ ] Create shop works
- [ ] List shops works
- [ ] Update shop works
- [ ] Delete shop works
- [ ] Add vendor works
- [ ] Remove vendor works
- [ ] Permission checks work correctly
- [ ] Server builds without errors

## Acceptance Criteria

- ✅ All shop operations in ShopRepository
- ✅ All role operations in UserShopRoleRepository
- ✅ shop.ts uses repositories exclusively
- ✅ Middleware uses repositories
- ✅ No database queries in shop router or middleware
- ✅ All shop functionality works as before
- ✅ Code is cleaner and more maintainable

## Estimated Time
**2 hours**

## Status
⏳ **PENDING** (Requires Phase 2 completion)

## Notes
- Two repositories work together (Shop + Roles)
- Good example of repository composition
- Middleware also benefits from repositories
- Test permission checks thoroughly

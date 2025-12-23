# Phase 2: Backend API - Shop Management

**Status**: ⏳ To Do  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 1 completed

---

## Objectives

Create tRPC routers and middleware for shop management:
1. Shop CRUD operations
2. Vendor management (add/remove vendors)
3. Role-based access control
4. Shop ownership validation

---

## Middleware: Shop Owner Validation

**File**: `src/middleware/shopOwner.ts`

```typescript
import { TRPCError } from '@trpc/server';
import { Context } from '../context';
import { db } from '../db';

export async function requireShopOwner(
  ctx: Context,
  shopId: number
): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  const role = await db
    .selectFrom('user_shop_roles')
    .select(['role'])
    .where('user_id', '=', ctx.user.id)
    .where('shop_id', '=', shopId)
    .where('role', '=', 'shop-owner')
    .executeTakeFirst();

  if (!role) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only shop owners can perform this action',
    });
  }
}

export async function requireShopAccess(
  ctx: Context,
  shopId: number
): Promise<void> {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }

  const role = await db
    .selectFrom('user_shop_roles')
    .select(['role'])
    .where('user_id', '=', ctx.user.id)
    .where('shop_id', '=', shopId)
    .executeTakeFirst();

  if (!role) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this shop',
    });
  }
}
```

---

## Shop Router

**File**: `src/routers/shop.ts`

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { TRPCError } from '@trpc/server';
import { requireShopOwner, requireShopAccess } from '../middleware/shopOwner';

export const shopRouter = router({
  // Create a new shop
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create shop
      const shop = await db
        .insertInto('shops')
        .values({
          name: input.name,
          description: input.description || null,
          owner_id: ctx.user.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning(['id', 'name', 'description', 'owner_id', 'created_at', 'updated_at'])
        .executeTakeFirstOrThrow();

      // Assign shop-owner role
      await db
        .insertInto('user_shop_roles')
        .values({
          user_id: ctx.user.id,
          shop_id: shop.id,
          role: 'shop-owner',
          created_at: new Date(),
        })
        .execute();

      return shop;
    }),

  // List shops where user is owner or vendor
  list: protectedProcedure.query(async ({ ctx }) => {
    const shops = await db
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
      .where('user_shop_roles.user_id', '=', ctx.user.id)
      .execute();

    return shops;
  }),

  // Get shop details
  get: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireShopAccess(ctx, input.shopId);

      const shop = await db
        .selectFrom('shops')
        .selectAll()
        .where('id', '=', input.shopId)
        .executeTakeFirst();

      if (!shop) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shop not found',
        });
      }

      return shop;
    }),

  // Update shop (owner only)
  update: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      const updateData: any = {
        updated_at: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;

      const shop = await db
        .updateTable('shops')
        .set(updateData)
        .where('id', '=', input.shopId)
        .returning(['id', 'name', 'description', 'owner_id', 'created_at', 'updated_at'])
        .executeTakeFirst();

      if (!shop) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shop not found',
        });
      }

      return shop;
    }),

  // Delete shop (owner only)
  delete: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      await db
        .deleteFrom('shops')
        .where('id', '=', input.shopId)
        .execute();

      return { success: true };
    }),

  // Add vendor to shop (owner only)
  addVendor: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      // Check if user exists
      const user = await db
        .selectFrom('users')
        .select(['id'])
        .where('id', '=', input.userId)
        .executeTakeFirst();

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if already has vendor role
      const existingRole = await db
        .selectFrom('user_shop_roles')
        .select(['id'])
        .where('user_id', '=', input.userId)
        .where('shop_id', '=', input.shopId)
        .where('role', '=', 'vendor')
        .executeTakeFirst();

      if (existingRole) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already a vendor for this shop',
        });
      }

      // Add vendor role
      const role = await db
        .insertInto('user_shop_roles')
        .values({
          user_id: input.userId,
          shop_id: input.shopId,
          role: 'vendor',
          created_at: new Date(),
        })
        .returning(['id', 'user_id', 'shop_id', 'role', 'created_at'])
        .executeTakeFirstOrThrow();

      return role;
    }),

  // Remove vendor from shop (owner only)
  removeVendor: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireShopOwner(ctx, input.shopId);

      await db
        .deleteFrom('user_shop_roles')
        .where('user_id', '=', input.userId)
        .where('shop_id', '=', input.shopId)
        .where('role', '=', 'vendor')
        .execute();

      return { success: true };
    }),

  // List vendors for a shop
  listVendors: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      await requireShopAccess(ctx, input.shopId);

      const vendors = await db
        .selectFrom('user_shop_roles')
        .innerJoin('users', 'users.id', 'user_shop_roles.user_id')
        .select([
          'users.id',
          'users.username',
          'user_shop_roles.role',
          'user_shop_roles.created_at as assigned_at',
        ])
        .where('user_shop_roles.shop_id', '=', input.shopId)
        .execute();

      return vendors;
    }),
});
```

---

## Register Router

**File**: `src/routers/index.ts`

Add the shop router to the app router:

```typescript
import { shopRouter } from './shop';

export const appRouter = router({
  // ... existing routers
  shop: shopRouter,
});
```

---

## API Endpoints

### shop.create
- **Input**: `{ name: string, description?: string }`
- **Returns**: Shop object
- **Auth**: Required
- **Role**: Any authenticated user

### shop.list
- **Input**: None
- **Returns**: Array of shops with user's role
- **Auth**: Required
- **Role**: Any authenticated user

### shop.get
- **Input**: `{ shopId: number }`
- **Returns**: Shop object
- **Auth**: Required
- **Role**: Shop owner or vendor

### shop.update
- **Input**: `{ shopId: number, name?: string, description?: string }`
- **Returns**: Updated shop object
- **Auth**: Required
- **Role**: Shop owner only

### shop.delete
- **Input**: `{ shopId: number }`
- **Returns**: `{ success: true }`
- **Auth**: Required
- **Role**: Shop owner only

### shop.addVendor
- **Input**: `{ shopId: number, userId: number }`
- **Returns**: UserShopRole object
- **Auth**: Required
- **Role**: Shop owner only

### shop.removeVendor
- **Input**: `{ shopId: number, userId: number }`
- **Returns**: `{ success: true }`
- **Auth**: Required
- **Role**: Shop owner only

### shop.listVendors
- **Input**: `{ shopId: number }`
- **Returns**: Array of vendors with user info
- **Auth**: Required
- **Role**: Shop owner or vendor

---

## Testing with tRPC Client

```typescript
// Create shop
const shop = await trpc.shop.create.mutate({
  name: 'My Store',
  description: 'Best products in town',
});

// List my shops
const shops = await trpc.shop.list.query();

// Get shop details
const shopDetail = await trpc.shop.get.query({ shopId: 1 });

// Update shop
const updated = await trpc.shop.update.mutate({
  shopId: 1,
  name: 'Updated Store Name',
});

// Add vendor
await trpc.shop.addVendor.mutate({
  shopId: 1,
  userId: 5,
});

// List vendors
const vendors = await trpc.shop.listVendors.query({ shopId: 1 });

// Remove vendor
await trpc.shop.removeVendor.mutate({
  shopId: 1,
  userId: 5,
});

// Delete shop
await trpc.shop.delete.mutate({ shopId: 1 });
```

---

## Validation Checklist

- [ ] Shop router created
- [ ] Middleware functions created
- [ ] Router registered in app router
- [ ] TypeScript types correct
- [ ] All endpoints tested manually
- [ ] Auth requirements enforced
- [ ] Owner-only operations protected
- [ ] Error messages clear and helpful
- [ ] Cascade deletes working (shop deletion removes roles)

---

## Error Scenarios

| Scenario | Error Code | Message |
|----------|------------|---------|
| Not logged in | UNAUTHORIZED | You must be logged in |
| Not shop owner | FORBIDDEN | Only shop owners can perform this action |
| No shop access | FORBIDDEN | You do not have access to this shop |
| Shop not found | NOT_FOUND | Shop not found |
| User not found (addVendor) | NOT_FOUND | User not found |
| Vendor already exists | CONFLICT | User is already a vendor for this shop |

---

**Phase 2 Completion Criteria**:
✅ Shop router implemented  
✅ Middleware created and working  
✅ All 8 endpoints functional  
✅ Access control enforced  
✅ Manual testing passed  
✅ Ready for Phase 3 (Product Management API)

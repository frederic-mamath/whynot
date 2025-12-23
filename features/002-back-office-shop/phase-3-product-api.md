# Phase 3: Backend API - Product Management

**Status**: ⏳ To Do  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 2 completed

---

## Objectives

Create tRPC router for product management:
1. Product CRUD operations
2. Product-channel associations
3. Vendor/owner access control
4. Product listing and filtering

---

## Product Router

**File**: `src/routers/product.ts`

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { TRPCError } from '@trpc/server';

async function requireProductAccess(ctx: any, shopId: number): Promise<void> {
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

export const productRouter = router({
  // Create product
  create: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireProductAccess(ctx, input.shopId);

      const product = await db
        .insertInto('products')
        .values({
          shop_id: input.shopId,
          name: input.name,
          description: input.description || null,
          price: input.price ? input.price.toFixed(2) : null,
          image_url: input.imageUrl || null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning([
          'id',
          'shop_id',
          'name',
          'description',
          'price',
          'image_url',
          'is_active',
          'created_at',
          'updated_at',
        ])
        .executeTakeFirstOrThrow();

      return product;
    }),

  // List products by shop
  list: protectedProcedure
    .input(
      z.object({
        shopId: z.number(),
        activeOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await requireProductAccess(ctx, input.shopId);

      let query = db
        .selectFrom('products')
        .selectAll()
        .where('shop_id', '=', input.shopId)
        .orderBy('created_at', 'desc');

      if (input.activeOnly) {
        query = query.where('is_active', '=', true);
      }

      const products = await query.execute();
      return products;
    }),

  // Get product details
  get: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const product = await db
        .selectFrom('products')
        .selectAll()
        .where('id', '=', input.productId)
        .executeTakeFirst();

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      await requireProductAccess(ctx, product.shop_id);
      return product;
    }),

  // Update product
  update: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        imageUrl: z.string().url().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .selectFrom('products')
        .select(['shop_id'])
        .where('id', '=', input.productId)
        .executeTakeFirst();

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      await requireProductAccess(ctx, existing.shop_id);

      const updateData: any = {
        updated_at: new Date(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price !== undefined) updateData.price = input.price.toFixed(2);
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;
      if (input.isActive !== undefined) updateData.is_active = input.isActive;

      const product = await db
        .updateTable('products')
        .set(updateData)
        .where('id', '=', input.productId)
        .returning([
          'id',
          'shop_id',
          'name',
          'description',
          'price',
          'image_url',
          'is_active',
          'created_at',
          'updated_at',
        ])
        .executeTakeFirstOrThrow();

      return product;
    }),

  // Delete product
  delete: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db
        .selectFrom('products')
        .select(['shop_id'])
        .where('id', '=', input.productId)
        .executeTakeFirst();

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      await requireProductAccess(ctx, existing.shop_id);

      await db
        .deleteFrom('products')
        .where('id', '=', input.productId)
        .execute();

      return { success: true };
    }),

  // Associate product with channel
  associateToChannel: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        channelId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await db
        .selectFrom('products')
        .select(['shop_id'])
        .where('id', '=', input.productId)
        .executeTakeFirst();

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      await requireProductAccess(ctx, product.shop_id);

      // Check if channel exists
      const channel = await db
        .selectFrom('channels')
        .select(['id'])
        .where('id', '=', input.channelId)
        .executeTakeFirst();

      if (!channel) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Channel not found',
        });
      }

      // Check if already associated
      const existing = await db
        .selectFrom('channel_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('product_id', '=', input.productId)
        .executeTakeFirst();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Product already associated with this channel',
        });
      }

      const association = await db
        .insertInto('channel_products')
        .values({
          channel_id: input.channelId,
          product_id: input.productId,
          created_at: new Date(),
        })
        .returning(['id', 'channel_id', 'product_id', 'created_at'])
        .executeTakeFirstOrThrow();

      return association;
    }),

  // Remove product from channel
  removeFromChannel: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        channelId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await db
        .selectFrom('products')
        .select(['shop_id'])
        .where('id', '=', input.productId)
        .executeTakeFirst();

      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      await requireProductAccess(ctx, product.shop_id);

      await db
        .deleteFrom('channel_products')
        .where('channel_id', '=', input.channelId)
        .where('product_id', '=', input.productId)
        .execute();

      return { success: true };
    }),

  // List products by channel
  listByChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const products = await db
        .selectFrom('channel_products')
        .innerJoin('products', 'products.id', 'channel_products.product_id')
        .innerJoin('shops', 'shops.id', 'products.shop_id')
        .select([
          'products.id',
          'products.shop_id',
          'products.name',
          'products.description',
          'products.price',
          'products.image_url',
          'products.is_active',
          'products.created_at',
          'products.updated_at',
          'shops.name as shop_name',
        ])
        .where('channel_products.channel_id', '=', input.channelId)
        .where('products.is_active', '=', true)
        .orderBy('products.created_at', 'desc')
        .execute();

      return products;
    }),
});
```

---

## Register Router

**File**: `src/routers/index.ts`

```typescript
import { productRouter } from './product';

export const appRouter = router({
  // ... existing routers
  shop: shopRouter,
  product: productRouter,
});
```

---

## API Endpoints

### product.create
- **Input**: `{ shopId: number, name: string, description?: string, price?: number, imageUrl?: string }`
- **Returns**: Product object
- **Auth**: Required
- **Role**: Shop owner or vendor

### product.list
- **Input**: `{ shopId: number, activeOnly?: boolean }`
- **Returns**: Array of products
- **Auth**: Required
- **Role**: Shop owner or vendor

### product.get
- **Input**: `{ productId: number }`
- **Returns**: Product object
- **Auth**: Required
- **Role**: Shop owner or vendor (of product's shop)

### product.update
- **Input**: `{ productId: number, name?: string, description?: string, price?: number, imageUrl?: string, isActive?: boolean }`
- **Returns**: Updated product object
- **Auth**: Required
- **Role**: Shop owner or vendor

### product.delete
- **Input**: `{ productId: number }`
- **Returns**: `{ success: true }`
- **Auth**: Required
- **Role**: Shop owner or vendor

### product.associateToChannel
- **Input**: `{ productId: number, channelId: number }`
- **Returns**: ChannelProduct object
- **Auth**: Required
- **Role**: Shop owner or vendor

### product.removeFromChannel
- **Input**: `{ productId: number, channelId: number }`
- **Returns**: `{ success: true }`
- **Auth**: Required
- **Role**: Shop owner or vendor

### product.listByChannel
- **Input**: `{ channelId: number }`
- **Returns**: Array of products with shop info
- **Auth**: Required
- **Role**: Any authenticated user

---

## Testing with tRPC Client

```typescript
// Create product
const product = await trpc.product.create.mutate({
  shopId: 1,
  name: 'Amazing Product',
  description: 'Best product ever',
  price: 29.99,
  imageUrl: 'https://example.com/image.jpg',
});

// List products
const products = await trpc.product.list.query({
  shopId: 1,
  activeOnly: true,
});

// Get product
const productDetail = await trpc.product.get.query({ productId: 1 });

// Update product
const updated = await trpc.product.update.mutate({
  productId: 1,
  price: 24.99,
  isActive: false,
});

// Associate to channel
await trpc.product.associateToChannel.mutate({
  productId: 1,
  channelId: 5,
});

// List channel products
const channelProducts = await trpc.product.listByChannel.query({ channelId: 5 });

// Remove from channel
await trpc.product.removeFromChannel.mutate({
  productId: 1,
  channelId: 5,
});

// Delete product
await trpc.product.delete.mutate({ productId: 1 });
```

---

## Validation Checklist

- [ ] Product router created
- [ ] Router registered in app router
- [ ] TypeScript types correct
- [ ] All endpoints tested manually
- [ ] Auth requirements enforced
- [ ] Shop access validated
- [ ] Price stored as decimal correctly
- [ ] Channel associations working
- [ ] Cascade deletes working (product deletion removes associations)

---

## Error Scenarios

| Scenario | Error Code | Message |
|----------|------------|---------|
| No shop access | FORBIDDEN | You do not have access to this shop |
| Product not found | NOT_FOUND | Product not found |
| Channel not found | NOT_FOUND | Channel not found |
| Already associated | CONFLICT | Product already associated with this channel |
| Invalid price | BAD_REQUEST | Price must be non-negative |
| Invalid URL | BAD_REQUEST | Invalid image URL |

---

**Phase 3 Completion Criteria**:
✅ Product router implemented  
✅ All 8 endpoints functional  
✅ Access control enforced  
✅ Channel associations working  
✅ Manual testing passed  
✅ Ready for Phase 4 (Vendor Promotion API)

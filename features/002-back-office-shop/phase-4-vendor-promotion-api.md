# Phase 4: Backend API - Vendor Promotion

**Status**: ⏳ To Do  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 3 completed

---

## Objectives

Create tRPC router for vendor product promotion in channels:
1. Promote/unpromote products during live channels
2. Track promotion history
3. List active promotions per channel
4. Filter promotions by vendor

---

## Vendor Promotion Router

**File**: `src/routers/vendorPromotion.ts`

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';
import { TRPCError } from '@trpc/server';

async function requireVendorAccess(ctx: any, productId: number): Promise<void> {
  const product = await db
    .selectFrom('products')
    .select(['shop_id'])
    .where('id', '=', productId)
    .executeTakeFirst();

  if (!product) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Product not found',
    });
  }

  const role = await db
    .selectFrom('user_shop_roles')
    .select(['role'])
    .where('user_id', '=', ctx.user.id)
    .where('shop_id', '=', product.shop_id)
    .executeTakeFirst();

  if (!role) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this product',
    });
  }
}

export const vendorPromotionRouter = router({
  // Promote a product in a channel
  promote: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        productId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireVendorAccess(ctx, input.productId);

      // Check if product is associated with the channel
      const association = await db
        .selectFrom('channel_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('product_id', '=', input.productId)
        .executeTakeFirst();

      if (!association) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Product must be associated with the channel before promotion',
        });
      }

      // Check if already actively promoted by this vendor
      const existing = await db
        .selectFrom('vendor_promoted_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('vendor_id', '=', ctx.user.id)
        .where('product_id', '=', input.productId)
        .where('unpromoted_at', 'is', null)
        .executeTakeFirst();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already promoting this product',
        });
      }

      // Create promotion
      const promotion = await db
        .insertInto('vendor_promoted_products')
        .values({
          channel_id: input.channelId,
          vendor_id: ctx.user.id,
          product_id: input.productId,
          promoted_at: new Date(),
          unpromoted_at: null,
        })
        .returning([
          'id',
          'channel_id',
          'vendor_id',
          'product_id',
          'promoted_at',
          'unpromoted_at',
        ])
        .executeTakeFirstOrThrow();

      return promotion;
    }),

  // Unpromote a product
  unpromote: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        productId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireVendorAccess(ctx, input.productId);

      // Find active promotion
      const promotion = await db
        .selectFrom('vendor_promoted_products')
        .select(['id'])
        .where('channel_id', '=', input.channelId)
        .where('vendor_id', '=', ctx.user.id)
        .where('product_id', '=', input.productId)
        .where('unpromoted_at', 'is', null)
        .executeTakeFirst();

      if (!promotion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Active promotion not found',
        });
      }

      // Mark as unpromoted
      const updated = await db
        .updateTable('vendor_promoted_products')
        .set({ unpromoted_at: new Date() })
        .where('id', '=', promotion.id)
        .returning([
          'id',
          'channel_id',
          'vendor_id',
          'product_id',
          'promoted_at',
          'unpromoted_at',
        ])
        .executeTakeFirstOrThrow();

      return updated;
    }),

  // List actively promoted products in a channel
  listActive: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const promotions = await db
        .selectFrom('vendor_promoted_products')
        .innerJoin('products', 'products.id', 'vendor_promoted_products.product_id')
        .innerJoin('users', 'users.id', 'vendor_promoted_products.vendor_id')
        .innerJoin('shops', 'shops.id', 'products.shop_id')
        .select([
          'vendor_promoted_products.id as promotion_id',
          'vendor_promoted_products.promoted_at',
          'products.id as product_id',
          'products.name as product_name',
          'products.description as product_description',
          'products.price as product_price',
          'products.image_url as product_image',
          'users.id as vendor_id',
          'users.username as vendor_name',
          'shops.id as shop_id',
          'shops.name as shop_name',
        ])
        .where('vendor_promoted_products.channel_id', '=', input.channelId)
        .where('vendor_promoted_products.unpromoted_at', 'is', null)
        .where('products.is_active', '=', true)
        .orderBy('vendor_promoted_products.promoted_at', 'desc')
        .execute();

      return promotions;
    }),

  // List products promoted by a specific vendor in a channel
  listByVendor: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        vendorId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const promotions = await db
        .selectFrom('vendor_promoted_products')
        .innerJoin('products', 'products.id', 'vendor_promoted_products.product_id')
        .select([
          'vendor_promoted_products.id as promotion_id',
          'vendor_promoted_products.promoted_at',
          'vendor_promoted_products.unpromoted_at',
          'products.id as product_id',
          'products.name as product_name',
          'products.description as product_description',
          'products.price as product_price',
          'products.image_url as product_image',
        ])
        .where('vendor_promoted_products.channel_id', '=', input.channelId)
        .where('vendor_promoted_products.vendor_id', '=', input.vendorId)
        .orderBy('vendor_promoted_products.promoted_at', 'desc')
        .execute();

      return promotions;
    }),

  // Get vendor's active promotions in a channel
  myActivePromotions: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const promotions = await db
        .selectFrom('vendor_promoted_products')
        .innerJoin('products', 'products.id', 'vendor_promoted_products.product_id')
        .select([
          'vendor_promoted_products.id as promotion_id',
          'vendor_promoted_products.promoted_at',
          'products.id as product_id',
          'products.name as product_name',
          'products.description as product_description',
          'products.price as product_price',
          'products.image_url as product_image',
          'products.shop_id',
        ])
        .where('vendor_promoted_products.channel_id', '=', input.channelId)
        .where('vendor_promoted_products.vendor_id', '=', ctx.user.id)
        .where('vendor_promoted_products.unpromoted_at', 'is', null)
        .orderBy('vendor_promoted_products.promoted_at', 'desc')
        .execute();

      return promotions;
    }),

  // Get available products for vendor to promote in a channel
  availableProducts: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Get shops where user is vendor or owner
      const userShops = await db
        .selectFrom('user_shop_roles')
        .select(['shop_id'])
        .where('user_id', '=', ctx.user.id)
        .execute();

      const shopIds = userShops.map((s) => s.shop_id);

      if (shopIds.length === 0) {
        return [];
      }

      // Get products from those shops that are associated with the channel
      const products = await db
        .selectFrom('products')
        .innerJoin('channel_products', 'channel_products.product_id', 'products.id')
        .leftJoin(
          db
            .selectFrom('vendor_promoted_products')
            .select([
              'product_id',
              'vendor_id',
              'unpromoted_at',
            ])
            .where('vendor_id', '=', ctx.user.id)
            .where('unpromoted_at', 'is', null)
            .as('vpp'),
          (join) => join.onRef('vpp.product_id', '=', 'products.id')
        )
        .select([
          'products.id',
          'products.shop_id',
          'products.name',
          'products.description',
          'products.price',
          'products.image_url',
          db.raw('CASE WHEN vpp.product_id IS NOT NULL THEN true ELSE false END').as('is_promoted'),
        ])
        .where('channel_products.channel_id', '=', input.channelId)
        .where('products.shop_id', 'in', shopIds)
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
import { vendorPromotionRouter } from './vendorPromotion';

export const appRouter = router({
  // ... existing routers
  shop: shopRouter,
  product: productRouter,
  vendorPromotion: vendorPromotionRouter,
});
```

---

## API Endpoints

### vendorPromotion.promote
- **Input**: `{ channelId: number, productId: number }`
- **Returns**: VendorPromotedProduct object
- **Auth**: Required
- **Role**: Vendor/owner of product's shop

### vendorPromotion.unpromote
- **Input**: `{ channelId: number, productId: number }`
- **Returns**: Updated VendorPromotedProduct object
- **Auth**: Required
- **Role**: Vendor who promoted the product

### vendorPromotion.listActive
- **Input**: `{ channelId: number }`
- **Returns**: Array of active promotions with product, vendor, and shop info
- **Auth**: Required
- **Role**: Any authenticated user

### vendorPromotion.listByVendor
- **Input**: `{ channelId: number, vendorId: number }`
- **Returns**: Array of promotions (active and past) by vendor
- **Auth**: Required
- **Role**: Any authenticated user

### vendorPromotion.myActivePromotions
- **Input**: `{ channelId: number }`
- **Returns**: Array of current user's active promotions
- **Auth**: Required
- **Role**: Any authenticated user

### vendorPromotion.availableProducts
- **Input**: `{ channelId: number }`
- **Returns**: Array of products vendor can promote, with `is_promoted` flag
- **Auth**: Required
- **Role**: Vendor/owner

---

## Testing with tRPC Client

```typescript
// Promote a product
const promotion = await trpc.vendorPromotion.promote.mutate({
  channelId: 5,
  productId: 10,
});

// Get available products to promote
const available = await trpc.vendorPromotion.availableProducts.query({
  channelId: 5,
});

// Get my active promotions
const myPromotions = await trpc.vendorPromotion.myActivePromotions.query({
  channelId: 5,
});

// List all active promotions in channel
const activePromotions = await trpc.vendorPromotion.listActive.query({
  channelId: 5,
});

// Unpromote a product
await trpc.vendorPromotion.unpromote.mutate({
  channelId: 5,
  productId: 10,
});

// List promotions by specific vendor
const vendorPromotions = await trpc.vendorPromotion.listByVendor.query({
  channelId: 5,
  vendorId: 3,
});
```

---

## Workflow Example

```typescript
// 1. Vendor joins a channel
await trpc.channel.join.mutate({ channelId: 5 });

// 2. Vendor sees available products
const products = await trpc.vendorPromotion.availableProducts.query({ channelId: 5 });
// Returns: [{ id: 10, name: "Product A", is_promoted: false }, ...]

// 3. Vendor promotes a product
await trpc.vendorPromotion.promote.mutate({
  channelId: 5,
  productId: 10,
});

// 4. All viewers see the promoted product
const active = await trpc.vendorPromotion.listActive.query({ channelId: 5 });
// Returns: [{ product_name: "Product A", vendor_name: "John", ... }]

// 5. Vendor unpromotes later
await trpc.vendorPromotion.unpromote.mutate({
  channelId: 5,
  productId: 10,
});
```

---

## Validation Checklist

- [ ] Vendor promotion router created
- [ ] Router registered in app router
- [ ] TypeScript types correct
- [ ] All endpoints tested manually
- [ ] Auth requirements enforced
- [ ] Vendor access validated
- [ ] Product-channel association checked before promotion
- [ ] Duplicate promotion prevented
- [ ] Historical tracking working (unpromoted_at)
- [ ] Active promotions query correct

---

## Error Scenarios

| Scenario | Error Code | Message |
|----------|------------|---------|
| No vendor access | FORBIDDEN | You do not have access to this product |
| Product not found | NOT_FOUND | Product not found |
| Product not in channel | BAD_REQUEST | Product must be associated with the channel before promotion |
| Already promoting | CONFLICT | You are already promoting this product |
| Promotion not found | NOT_FOUND | Active promotion not found |

---

## Database Queries for Testing

```sql
-- View active promotions
SELECT 
  vpp.id,
  p.name as product_name,
  u.username as vendor_name,
  s.name as shop_name,
  vpp.promoted_at
FROM vendor_promoted_products vpp
JOIN products p ON p.id = vpp.product_id
JOIN users u ON u.id = vpp.vendor_id
JOIN shops s ON s.id = p.shop_id
WHERE vpp.channel_id = 5
AND vpp.unpromoted_at IS NULL;

-- View promotion history
SELECT 
  p.name as product_name,
  u.username as vendor_name,
  vpp.promoted_at,
  vpp.unpromoted_at,
  EXTRACT(EPOCH FROM (vpp.unpromoted_at - vpp.promoted_at)) / 60 as duration_minutes
FROM vendor_promoted_products vpp
JOIN products p ON p.id = vpp.product_id
JOIN users u ON u.id = vpp.vendor_id
WHERE vpp.channel_id = 5
ORDER BY vpp.promoted_at DESC;
```

---

**Phase 4 Completion Criteria**:
✅ Vendor promotion router implemented  
✅ All 6 endpoints functional  
✅ Access control enforced  
✅ Promotion tracking working  
✅ Available products query correct  
✅ Manual testing passed  
✅ Ready for Phase 5 (Shop Management UI)

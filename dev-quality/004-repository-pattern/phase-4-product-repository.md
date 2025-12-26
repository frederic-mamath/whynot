# Phase 4: Product Repository

## Objective
Create ProductRepository and ChannelProductRepository to handle all product-related database operations, then refactor the product router.

## Current State Analysis

The `product.ts` router is the largest router (~340 lines) with operations:
1. Create product
2. List products (by shop, by channel, active/inactive)
3. Get product by ID
4. Update product
5. Delete product (soft delete via is_active)
6. Associate product with channels
7. Remove channel associations
8. List channel associations

This is a complex router with lots of joining and filtering logic.

## Repositories to Create

### 1. `src/repositories/ProductRepository.ts`

```typescript
import { BaseRepository } from './base/BaseRepository';
import { ProductsTable, Product } from '../db/types';
import { db } from '../db';

/**
 * Repository for Product entity
 * Handles all product-related database operations
 */
export class ProductRepository extends BaseRepository<ProductsTable, 'products'> {
  constructor() {
    super('products');
  }

  /**
   * Find all products for a shop
   * @param shopId Shop ID
   * @param activeOnly Filter for active products only
   */
  async findByShopId(shopId: number, activeOnly = false): Promise<Product[]> {
    let query = db
      .selectFrom('products')
      .selectAll()
      .where('shop_id', '=', shopId)
      .orderBy('created_at', 'desc');
    
    if (activeOnly) {
      query = query.where('is_active', '=', true);
    }
    
    return query.execute();
  }

  /**
   * Find all active products across all shops
   */
  async findAllActive(): Promise<Product[]> {
    return db
      .selectFrom('products')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /**
   * Find products with shop information
   * Used for displaying product listings with shop names
   */
  async findWithShopInfo(productId?: number) {
    let query = db
      .selectFrom('products')
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
      ]);
    
    if (productId) {
      query = query.where('products.id', '=', productId);
      return query.executeTakeFirst();
    }
    
    return query.execute();
  }

  /**
   * Create product
   */
  async createProduct(data: {
    shop_id: number;
    name: string;
    description: string | null;
    price: string | null;
    image_url: string | null;
  }): Promise<Product> {
    return db
      .insertInto('products')
      .values({
        ...data,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: number,
    data: {
      name?: string;
      description?: string | null;
      price?: string | null;
      image_url?: string | null;
      is_active?: boolean;
    }
  ): Promise<Product | undefined> {
    return this.update(productId, data);
  }

  /**
   * Set product active status (soft delete)
   * @param productId Product ID
   * @param isActive Active status
   */
  async setActive(productId: number, isActive: boolean): Promise<Product | undefined> {
    return this.update(productId, { is_active: isActive });
  }

  /**
   * Find products by channel
   * @param channelId Channel ID
   */
  async findByChannelId(channelId: number): Promise<Product[]> {
    return db
      .selectFrom('products')
      .innerJoin('channel_products', 'channel_products.product_id', 'products.id')
      .selectAll('products')
      .where('channel_products.channel_id', '=', channelId)
      .where('products.is_active', '=', true)
      .execute();
  }

  /**
   * Check if product belongs to shop
   * @param productId Product ID
   * @param shopId Shop ID
   */
  async belongsToShop(productId: number, shopId: number): Promise<boolean> {
    const product = await db
      .selectFrom('products')
      .select(['id'])
      .where('id', '=', productId)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
    
    return product !== undefined;
  }

  /**
   * Get product's shop ID
   * @param productId Product ID
   */
  async getShopId(productId: number): Promise<number | undefined> {
    const result = await db
      .selectFrom('products')
      .select(['shop_id'])
      .where('id', '=', productId)
      .executeTakeFirst();
    
    return result?.shop_id;
  }
}

// Export singleton instance
export const productRepository = new ProductRepository();
```

### 2. `src/repositories/ChannelProductRepository.ts`

```typescript
import { db } from '../db';
import { ChannelProduct } from '../db/types';

/**
 * Repository for ChannelProduct associations
 * Handles product-channel relationships
 */
export class ChannelProductRepository {
  /**
   * Associate product with channel
   * @param channelId Channel ID
   * @param productId Product ID
   */
  async associateProduct(
    channelId: number,
    productId: number
  ): Promise<ChannelProduct> {
    return db
      .insertInto('channel_products')
      .values({
        channel_id: channelId,
        product_id: productId,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Remove product from channel
   * @param channelId Channel ID
   * @param productId Product ID
   */
  async removeProduct(channelId: number, productId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('channel_products')
      .where('channel_id', '=', channelId)
      .where('product_id', '=', productId)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Check if product is associated with channel
   * @param channelId Channel ID
   * @param productId Product ID
   */
  async isAssociated(channelId: number, productId: number): Promise<boolean> {
    const result = await db
      .selectFrom('channel_products')
      .select(['id'])
      .where('channel_id', '=', channelId)
      .where('product_id', '=', productId)
      .executeTakeFirst();
    
    return result !== undefined;
  }

  /**
   * Find all products for a channel
   * @param channelId Channel ID
   */
  async findByChannelId(channelId: number): Promise<ChannelProduct[]> {
    return db
      .selectFrom('channel_products')
      .selectAll()
      .where('channel_id', '=', channelId)
      .execute();
  }

  /**
   * Find all channels for a product
   * @param productId Product ID
   */
  async findByProductId(productId: number): Promise<ChannelProduct[]> {
    return db
      .selectFrom('channel_products')
      .selectAll()
      .where('product_id', '=', productId)
      .execute();
  }

  /**
   * Remove all associations for a channel
   * @param channelId Channel ID
   */
  async removeAllByChannel(channelId: number): Promise<number> {
    const result = await db
      .deleteFrom('channel_products')
      .where('channel_id', '=', channelId)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows);
  }

  /**
   * Remove all associations for a product
   * @param productId Product ID
   */
  async removeAllByProduct(productId: number): Promise<number> {
    const result = await db
      .deleteFrom('channel_products')
      .where('product_id', '=', productId)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows);
  }
}

// Export singleton instance
export const channelProductRepository = new ChannelProductRepository();
```

## Router Refactoring

### Before (product.ts - current):
```typescript
create: protectedProcedure.mutation(async ({ ctx, input }) => {
  await requireProductAccess(ctx, input.shopId);

  const productData = mapCreateProductInboundDtoToProduct({...input});

  const product = await db
    .insertInto('products')
    .values({
      shop_id: productData.shop_id,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image_url: productData.image_url,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return mapProductToProductOutboundDto(product);
}),

list: protectedProcedure
  .input(z.object({ shopId: z.number(), activeOnly: z.boolean().optional() }))
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
    return products.map(mapProductToProductOutboundDto);
  }),
```

### After (with repositories):
```typescript
import { productRepository, channelProductRepository } from '../repositories';

create: protectedProcedure.mutation(async ({ ctx, input }) => {
  await requireProductAccess(ctx, input.shopId);

  const productData = mapCreateProductInboundDtoToProduct({...input});
  const product = await productRepository.createProduct(productData);

  return mapProductToProductOutboundDto(product);
}),

list: protectedProcedure
  .input(z.object({ shopId: z.number(), activeOnly: z.boolean().optional() }))
  .query(async ({ ctx, input }) => {
    await requireProductAccess(ctx, input.shopId);

    const products = await productRepository.findByShopId(
      input.shopId,
      input.activeOnly
    );
    
    return products.map(mapProductToProductOutboundDto);
  }),
```

## Implementation Steps

### Step 1: Create ProductRepository
```bash
touch src/repositories/ProductRepository.ts
```

### Step 2: Create ChannelProductRepository
```bash
touch src/repositories/ChannelProductRepository.ts
```

### Step 3: Export Repositories
Update `src/repositories/index.ts`:
```typescript
export { productRepository } from './ProductRepository';
export { channelProductRepository } from './ChannelProductRepository';
```

### Step 4: Refactor product.ts Router
- Import both repositories
- Replace all product queries with repository calls
- Replace channel association queries
- Simplify complex queries using repository methods

### Step 5: Test All Product Operations
- Create product
- List products (all scenarios)
- Update product
- Soft delete (set inactive)
- Associate with channel
- Remove from channel
- List associations

## Files to Modify

### New Files:
- `src/repositories/ProductRepository.ts`
- `src/repositories/ChannelProductRepository.ts`

### Modified Files:
- `src/repositories/index.ts` - Add exports
- `src/routers/product.ts` - Replace database calls

## Benefits

### Router Complexity Reduction:
- **Before**: ~340 lines with complex joins
- **After**: ~170 lines of clean business logic
- **Savings**: 50% code reduction

### Readability:
```typescript
// Before: What does this do?
const products = await db
  .selectFrom('products')
  .innerJoin('shops', 'shops.id', 'products.shop_id')
  .select([...15 fields...])
  .where('products.is_active', '=', true)
  .execute();

// After: Crystal clear!
const products = await productRepository.findWithShopInfo();
```

## Validation Checklist

- [ ] ProductRepository created
- [ ] ChannelProductRepository created
- [ ] Both exported from index.ts
- [ ] product.ts refactored
- [ ] Create product works
- [ ] List products works (all filters)
- [ ] Update product works
- [ ] Set active/inactive works
- [ ] Associate with channel works
- [ ] Remove from channel works
- [ ] List associations works
- [ ] Server builds without errors

## Acceptance Criteria

- ✅ All product operations in ProductRepository
- ✅ All channel associations in ChannelProductRepository
- ✅ product.ts uses repositories exclusively
- ✅ No database queries in product router
- ✅ Router is 50% smaller
- ✅ All product functionality works as before
- ✅ Complex queries simplified

## Estimated Time
**2 hours**

## Status
⏳ **PENDING** (Requires Phase 3 completion)

## Notes
- This is the most complex router to refactor
- Good test of repository pattern effectiveness
- Shows dramatic code reduction
- Repository methods are highly reusable

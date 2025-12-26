# Phase 6: Vendor Promotion Repository & Final Refactoring

## Objective
Create VendorPromotionRepository, complete the repository layer, refactor remaining routers, update documentation, and perform comprehensive testing.

## Current State Analysis

The `vendorPromotion.ts` router handles:
1. Promote product (vendor can promote their product in a channel)
2. Unpromote product
3. Get active promotions for channel
4. Get vendor's current promotion in channel

This is the final router to refactor.

## Repository to Create

### `src/repositories/VendorPromotionRepository.ts`

```typescript
import { db } from '../db';
import { VendorPromotedProduct } from '../db/types';

/**
 * Repository for VendorPromotedProduct entity
 * Handles vendor product promotions in channels
 */
export class VendorPromotionRepository {
  /**
   * Promote a product in a channel
   * @param channelId Channel ID
   * @param vendorId Vendor user ID
   * @param productId Product ID to promote
   */
  async promoteProduct(
    channelId: number,
    vendorId: number,
    productId: number
  ): Promise<VendorPromotedProduct> {
    return db
      .insertInto('vendor_promoted_products')
      .values({
        channel_id: channelId,
        vendor_id: vendorId,
        product_id: productId,
        promoted_at: new Date(),
        unpromoted_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Unpromote a product (mark as unpromoted)
   * @param promotionId Promotion ID
   */
  async unpromoteProduct(promotionId: number): Promise<VendorPromotedProduct | undefined> {
    return db
      .updateTable('vendor_promoted_products')
      .set({ unpromoted_at: new Date() })
      .where('id', '=', promotionId)
      .where('unpromoted_at', 'is', null)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Unpromote product by channel and vendor
   * @param channelId Channel ID
   * @param vendorId Vendor ID
   * @param productId Product ID
   */
  async unpromoteByIds(
    channelId: number,
    vendorId: number,
    productId: number
  ): Promise<boolean> {
    const result = await db
      .updateTable('vendor_promoted_products')
      .set({ unpromoted_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('vendor_id', '=', vendorId)
      .where('product_id', '=', productId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numChangedRows) > 0;
  }

  /**
   * Get active promotions for a channel
   * @param channelId Channel ID
   */
  async getActivePromotions(channelId: number): Promise<VendorPromotedProduct[]> {
    return db
      .selectFrom('vendor_promoted_products')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('unpromoted_at', 'is', null)
      .orderBy('promoted_at', 'desc')
      .execute();
  }

  /**
   * Get active promotions with product and vendor details
   * @param channelId Channel ID
   */
  async getActivePromotionsWithDetails(channelId: number) {
    return db
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
        'users.email as vendor_name',
        'shops.id as shop_id',
        'shops.name as shop_name',
      ])
      .where('vendor_promoted_products.channel_id', '=', channelId)
      .where('vendor_promoted_products.unpromoted_at', 'is', null)
      .where('products.is_active', '=', true)
      .orderBy('vendor_promoted_products.promoted_at', 'desc')
      .execute();
  }

  /**
   * Get vendor's current promotion in channel
   * @param channelId Channel ID
   * @param vendorId Vendor ID
   */
  async getVendorCurrentPromotion(
    channelId: number,
    vendorId: number
  ): Promise<VendorPromotedProduct | undefined> {
    return db
      .selectFrom('vendor_promoted_products')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('vendor_id', '=', vendorId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Check if vendor has active promotion in channel
   * @param channelId Channel ID
   * @param vendorId Vendor ID
   */
  async hasActivePromotion(channelId: number, vendorId: number): Promise<boolean> {
    const promotion = await this.getVendorCurrentPromotion(channelId, vendorId);
    return promotion !== undefined;
  }

  /**
   * Check if specific product is currently promoted in channel
   * @param channelId Channel ID
   * @param productId Product ID
   */
  async isProductPromoted(channelId: number, productId: number): Promise<boolean> {
    const promotion = await db
      .selectFrom('vendor_promoted_products')
      .select(['id'])
      .where('channel_id', '=', channelId)
      .where('product_id', '=', productId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
    
    return promotion !== undefined;
  }

  /**
   * Get all promotions for a product (active and past)
   * @param productId Product ID
   */
  async getProductPromotionHistory(productId: number): Promise<VendorPromotedProduct[]> {
    return db
      .selectFrom('vendor_promoted_products')
      .selectAll()
      .where('product_id', '=', productId)
      .orderBy('promoted_at', 'desc')
      .execute();
  }

  /**
   * Unpromote all products in a channel (when channel ends)
   * @param channelId Channel ID
   */
  async unpromoteAllInChannel(channelId: number): Promise<number> {
    const result = await db
      .updateTable('vendor_promoted_products')
      .set({ unpromoted_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numChangedRows);
  }
}

// Export singleton instance
export const vendorPromotionRepository = new VendorPromotionRepository();
```

## Final Router Refactoring

### Before (vendorPromotion.ts):
```typescript
promote: protectedProcedure
  .input(z.object({ channelId: z.number(), productId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Complex validation and promotion logic mixed with queries
    const promotion = await db
      .insertInto('vendor_promoted_products')
      .values({
        channel_id: input.channelId,
        vendor_id: ctx.user.id,
        product_id: input.productId,
        promoted_at: new Date(),
        unpromoted_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return promotion;
  }),
```

### After (with repository):
```typescript
import { vendorPromotionRepository } from '../repositories';

promote: protectedProcedure
  .input(z.object({ channelId: z.number(), productId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    // Business logic only
    const promotion = await vendorPromotionRepository.promoteProduct(
      input.channelId,
      ctx.user.id,
      input.productId
    );

    return promotion;
  }),
```

## Additional Tasks

### 1. Update Repository Index
Final `src/repositories/index.ts`:
```typescript
/**
 * Repository layer exports
 * Repositories encapsulate all database access logic
 */

// Base classes and types
export * from './base/types';
export * from './base/BaseRepository';

// Repository instances
export { userRepository } from './UserRepository';
export { shopRepository } from './ShopRepository';
export { userShopRoleRepository } from './UserShopRoleRepository';
export { productRepository } from './ProductRepository';
export { channelProductRepository } from './ChannelProductRepository';
export { channelRepository } from './ChannelRepository';
export { channelParticipantRepository } from './ChannelParticipantRepository';
export { vendorPromotionRepository } from './VendorPromotionRepository';
```

### 2. Update ARCHITECTURE.md
Add repository layer documentation:

```markdown
## Repository Layer

The application uses the Repository Pattern to separate data access logic from business logic.

### Structure
- `src/repositories/` - All repository classes
- `src/repositories/base/` - Base classes and interfaces
- Each entity has its own repository

### Repositories
- `UserRepository` - User CRUD and authentication
- `ShopRepository` - Shop management
- `UserShopRoleRepository` - Shop permissions
- `ProductRepository` - Product operations
- `ChannelProductRepository` - Product-channel associations
- `ChannelRepository` - Channel lifecycle
- `ChannelParticipantRepository` - Participant management
- `VendorPromotionRepository` - Product promotions

### Benefits
- Clear separation of concerns
- Easy to test (mock repositories)
- Type-safe database operations
- Centralized data access logic
```

### 3. Create README for Repositories
Create `src/repositories/README.md`:

```markdown
# Repository Layer

## Overview
This directory contains all repository classes that encapsulate database access logic.

## Pattern
Each repository:
- Handles one entity or related entities
- Extends BaseRepository for common CRUD
- Provides domain-specific query methods
- Returns strongly-typed results

## Usage Example
```typescript
import { userRepository } from '../repositories';

// In your router
const user = await userRepository.findByEmail(email);
const newUser = await userRepository.createUser(email, password);
```

## Testing
Repositories can be easily mocked:
```typescript
jest.mock('../repositories', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  }
}));
```

## Adding New Repositories
1. Create new file: `src/repositories/EntityRepository.ts`
2. Extend BaseRepository if appropriate
3. Add entity-specific methods
4. Export singleton instance
5. Add to `index.ts` exports
```

## Final Validation

### Checklist for All Routers

#### auth.ts
- [ ] Uses UserRepository
- [ ] No direct database calls
- [ ] All auth flows work

#### shop.ts
- [ ] Uses ShopRepository
- [ ] Uses UserShopRoleRepository
- [ ] No direct database calls
- [ ] All shop operations work

#### product.ts
- [ ] Uses ProductRepository
- [ ] Uses ChannelProductRepository
- [ ] No direct database calls
- [ ] All product operations work

#### channel.ts
- [ ] Uses ChannelRepository
- [ ] Uses ChannelParticipantRepository
- [ ] No direct database calls
- [ ] All channel operations work

#### vendorPromotion.ts
- [ ] Uses VendorPromotionRepository
- [ ] No direct database calls
- [ ] All promotion operations work

### Code Quality Checks
- [ ] All repositories properly typed
- [ ] All methods documented with JSDoc
- [ ] Consistent naming conventions
- [ ] No code duplication
- [ ] Error handling preserved

### Testing Checklist
Run through all major flows:
- [ ] User registration and login
- [ ] Create shop and manage vendors
- [ ] Create and manage products
- [ ] Create channel and manage participants
- [ ] Promote products in channels
- [ ] Permission checks work correctly

## Implementation Steps

### Step 1: Create VendorPromotionRepository
```bash
touch src/repositories/VendorPromotionRepository.ts
```

### Step 2: Refactor vendorPromotion.ts Router

### Step 3: Update Repository Index

### Step 4: Update Documentation
- Update ARCHITECTURE.md
- Create repositories/README.md

### Step 5: Comprehensive Testing
- Test all routers
- Test all operations
- Check for regressions

### Step 6: Code Review
- Review all repositories for consistency
- Check documentation completeness
- Verify type safety

## Files to Modify

### New Files:
- `src/repositories/VendorPromotionRepository.ts`
- `src/repositories/README.md`

### Modified Files:
- `src/repositories/index.ts` - Final exports
- `src/routers/vendorPromotion.ts` - Refactor
- `ARCHITECTURE.md` - Add repository documentation

## Final Metrics

### Code Reduction
- **Before**: 1,348 lines across 6 routers
- **After**: ~700 lines in routers + ~800 in repositories
- **Net**: Similar total, but better organized

### Router Complexity
- **auth.ts**: 50% smaller
- **shop.ts**: 40% smaller
- **product.ts**: 50% smaller (from 340 to ~170 lines)
- **channel.ts**: 45% smaller
- **vendorPromotion.ts**: 40% smaller

### Maintainability Gains
- ✅ Zero database queries in routers
- ✅ 8 well-documented repositories
- ✅ 100% type-safe operations
- ✅ Easy to test
- ✅ Clear separation of concerns

## Acceptance Criteria

- ✅ VendorPromotionRepository complete
- ✅ All 8 repositories implemented
- ✅ All 6 routers refactored
- ✅ All functionality works as before
- ✅ Documentation updated
- ✅ No database queries in business logic layer
- ✅ Comprehensive testing passed

## Estimated Time
**3 hours** (including testing and documentation)

## Status
⏳ **PENDING** (Requires Phase 5 completion)

## Notes
- This is the final phase - take time for thorough testing
- Document any discovered issues
- Consider creating unit tests for repositories
- Update team on new architecture

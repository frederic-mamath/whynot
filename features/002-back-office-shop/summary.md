# Feature 002: Back-Office Shop

**Feature Description**: Enable shop owners to create shops, manage vendors, create products, and associate products with channels. Vendors can connect to channels and promote specific products to viewers.

**Priority**: High  
**Complexity**: Medium-High  
**Estimated Total Time**: 14-16 hours

---

## Feature Overview

### Goals
- Allow users with "shop-owner" role to create and manage shops
- Enable shop owners to assign "vendor" roles to users for their shops
- Support product creation and management within shops
- Allow channels to be associated with multiple products
- Enable vendors to select which products they want to promote during a channel session
- Display promoted products in real-time during channel sessions

### Tech Stack
- **Backend**: tRPC, Kysely ORM, PostgreSQL
- **Frontend**: React, TypeScript, Shadcn UI, Tailwind CSS
- **Infrastructure**: Docker (PostgreSQL)

### Key Metrics
- Max vendors per shop: Unlimited
- Max products per shop: Unlimited
- Max products per channel: Unlimited
- Role-based access control at user-shop level

---

## Database Schema

### New Tables

#### shops
- `id` (serial, PK)
- `name` (varchar, not null)
- `description` (text, nullable)
- `owner_id` (integer, FK to users.id, not null)
- `created_at` (timestamp, not null)
- `updated_at` (timestamp, not null)

#### user_shop_roles
- `id` (serial, PK)
- `user_id` (integer, FK to users.id, not null)
- `shop_id` (integer, FK to shops.id, not null)
- `role` (varchar(50), not null) - "shop-owner" | "vendor"
- `created_at` (timestamp, not null)
- `unique(user_id, shop_id, role)` - A user can have multiple roles per shop

#### products
- `id` (serial, PK)
- `shop_id` (integer, FK to shops.id, not null)
- `name` (varchar(255), not null)
- `description` (text, nullable)
- `price` (decimal(10,2), nullable)
- `image_url` (varchar(500), nullable)
- `is_active` (boolean, default true)
- `created_at` (timestamp, not null)
- `updated_at` (timestamp, not null)

#### channel_products
- `id` (serial, PK)
- `channel_id` (integer, FK to channels.id, not null)
- `product_id` (integer, FK to products.id, not null)
- `created_at` (timestamp, not null)
- `unique(channel_id, product_id)`

#### vendor_promoted_products
- `id` (serial, PK)
- `channel_id` (integer, FK to channels.id, not null)
- `vendor_id` (integer, FK to users.id, not null)
- `product_id` (integer, FK to products.id, not null)
- `promoted_at` (timestamp, not null)
- `unpromoted_at` (timestamp, nullable)
- `unique(channel_id, vendor_id, product_id)` - One active promotion per vendor per product

---

## Implementation Phases

### Phase 1: Database Schema & Migrations
**Status**: ✅ Completed  
**Estimated Time**: 2 hours  
**Dependencies**: None

**Key Deliverables**:
- [x] Create migration for shops table
- [x] Create migration for user_shop_roles table
- [x] Create migration for products table
- [x] Create migration for channel_products table
- [x] Create migration for vendor_promoted_products table
- [x] Update Kysely types

**Files to Create**:
- `migrations/002_create_shops.ts`
- `migrations/003_create_user_shop_roles.ts`
- `migrations/004_create_products.ts`
- `migrations/005_create_channel_products.ts`
- `migrations/006_create_vendor_promoted_products.ts`

**Validation Criteria**:
- [x] Migrations run successfully
- [x] All tables created with correct columns and constraints
- [x] Foreign keys properly set up
- [x] Unique constraints working

---

### Phase 2: Backend API - Shop Management
**Status**: ✅ Completed  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 1 completed

**Key Deliverables**:
- [x] Shop tRPC router
- [x] Role validation middleware
- [x] Shop CRUD operations
- [x] Vendor management operations

**Files to Create**:
- `src/routers/shop.ts` - Shop management router
- `src/middleware/shopOwner.ts` - Shop owner role validation

**API Endpoints**:
- `shop.create` - Create new shop (authenticated users only)
- `shop.list` - List shops where user is owner or vendor
- `shop.get` - Get shop details (owner/vendor only)
- `shop.update` - Update shop (owner only)
- `shop.delete` - Delete shop (owner only)
- `shop.addVendor` - Add vendor to shop (owner only)
- `shop.removeVendor` - Remove vendor from shop (owner only)
- `shop.listVendors` - List all vendors for a shop (owner/vendor)

**Validation Criteria**:
- [x] Only authenticated users can create shops
- [x] User becomes shop-owner upon shop creation
- [x] Only shop owners can add/remove vendors
- [x] Only shop owners can update/delete shops
- [x] Vendors can view their assigned shops

---

### Phase 3: Backend API - Product Management
**Status**: ✅ Completed  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 2 completed

**Key Deliverables**:
- [x] Product tRPC router
- [x] Product CRUD operations
- [x] Product-channel association

**Files to Create**:
- `src/routers/product.ts` - Product management router

**API Endpoints**:
- `product.create` - Create product (shop owner/vendor)
- `product.list` - List products by shop (shop owner/vendor)
- `product.get` - Get product details
- `product.update` - Update product (shop owner/vendor)
- `product.delete` - Delete product (shop owner/vendor)
- `product.associateToChannel` - Link product to channel (shop owner/vendor)
- `product.removeFromChannel` - Unlink product from channel (shop owner/vendor)
- `product.listByChannel` - Get all products for a channel

**Validation Criteria**:
- [x] Only shop owners/vendors can create products for their shops
- [x] Products can be associated with multiple channels
- [x] Product list filtered by shop access rights

---

### Phase 4: Backend API - Vendor Promotion
**Status**: ✅ Completed  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 3 completed

**Key Deliverables**:
- [x] Vendor promotion tRPC router
- [x] Real-time promotion updates
- [x] Promotion history tracking

**Files to Create**:
- `src/routers/vendorPromotion.ts` - Vendor promotion router

**API Endpoints**:
- `vendorPromotion.promote` - Promote a product in a channel (vendor only)
- `vendorPromotion.unpromote` - Stop promoting a product (vendor only)
- `vendorPromotion.listActive` - Get actively promoted products in channel
- `vendorPromotion.listByVendor` - Get products promoted by specific vendor in channel

**Validation Criteria**:
- [x] Only vendors can promote products from their shops
- [x] Products must be associated with the channel before promotion
- [x] Multiple vendors can promote different products simultaneously
- [x] Promotion history is tracked with timestamps

---

### Phase 5: Frontend - Shop Management UI
**Status**: ✅ Completed  
**Estimated Time**: 3 hours  
**Dependencies**: Phase 2 completed

**Key Deliverables**:
- [x] Shop list page
- [x] Create shop page
- [x] Shop detail/edit page
- [x] Vendor management interface
- [x] Role-based navigation guards

**Files to Create**:
- `client/src/pages/ShopsPage.tsx` - List user's shops
- `client/src/pages/CreateShopPage.tsx` - Create new shop
- `client/src/pages/ShopDetailPage.tsx` - View/edit shop, manage vendors
- `client/src/components/VendorList/VendorList.tsx` - Vendor management component
- `client/src/components/AddVendorModal/AddVendorModal.tsx` - Add vendor modal

**Features**:
- [x] Display list of shops where user is owner or vendor
- [x] Create shop form (name, description)
- [x] Edit shop details (owner only)
- [x] Add vendors by user ID or email (owner only)
- [x] Remove vendors (owner only)
- [x] View vendor list with roles
- [x] Navigation link in NavBar (conditionally shown)

**Validation Criteria**:
- [x] Shop owners see "Shops" link in navigation
- [x] Non-shop-owners don't see shop management UI
- [x] Forms validate input correctly
- [x] Success/error toasts for all operations
- [x] Responsive design with Shadcn UI

---

### Phase 6: Frontend - Product Management UI
**Status**: ✅ Completed  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 3, Phase 5 completed

**Key Deliverables**:
- [x] Product list page (per shop)
- [x] Create product page
- [x] Edit product page
- [x] Product-channel association UI

**Files to Create**:
- `client/src/pages/ProductsPage.tsx` - List products for a shop
- `client/src/pages/CreateProductPage.tsx` - Create new product
- `client/src/pages/EditProductPage.tsx` - Edit product
- `client/src/components/ProductCard/ProductCard.tsx` - Product display card
- `client/src/components/AssociateProductModal/AssociateProductModal.tsx` - Link product to channel

**Features**:
- [x] Display products in grid/list view
- [x] Create product form (name, description, price, image URL)
- [x] Edit product details
- [x] Toggle product active status
- [x] Associate products with channels
- [x] View which channels a product is associated with
- [x] Product images with fallback

**Validation Criteria**:
- [x] Products grouped by shop
- [x] Only shop owner/vendor can create/edit products
- [x] Image URLs render correctly with fallback
- [x] Channel association works bidirectionally
- [x] Responsive grid layout

---

### Phase 7: Frontend - Vendor Promotion UI
**Status**: ⏳ To Do  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 4, Phase 6 completed

**Key Deliverables**:
- [ ] Vendor promotion panel in channel page
- [ ] Product selection interface for vendors
- [ ] Real-time promoted products display
- [ ] Promotion toggle controls

**Files to Create/Modify**:
- `client/src/components/VendorPromotionPanel/VendorPromotionPanel.tsx` - Vendor product selection
- `client/src/components/PromotedProductsList/PromotedProductsList.tsx` - Display promoted products
- `client/src/pages/ChannelPage.tsx` - Update to include promotion features

**Features**:
- [ ] Vendors see product selection panel in channel
- [ ] Vendors can toggle products on/off for promotion
- [ ] All participants see promoted products in real-time
- [ ] Promoted products show vendor name
- [ ] Visual indicator for active promotions
- [ ] Filters to show only vendor's products

**Validation Criteria**:
- [ ] Only vendors see promotion controls
- [ ] All participants see promoted products
- [ ] Real-time updates when products are promoted/unpromoted
- [ ] Multiple vendors can promote simultaneously
- [ ] Product info displays correctly (image, name, price)

---

## Phase Status Summary

| Phase | Status | Progress | Time Est. | Time Actual | Completion Date |
|-------|--------|----------|-----------|-------------|-----------------|
| Phase 1: Database | ✅ Done | 100% | 2h | ~2h | 2025-12-23 |
| Phase 2: Shop API | ✅ Done | 100% | 3h | ~3h | 2025-12-23 |
| Phase 3: Product API | ✅ Done | 100% | 2h | ~2h | 2025-12-23 |
| Phase 4: Promotion API | ✅ Done | 100% | 2h | ~2h | 2025-12-23 |
| Phase 5: Shop UI | ✅ Done | 100% | 3h | ~3h | 2025-12-23 |
| Phase 6: Product UI | ✅ Done | 100% | 2-3h | ~3h | 2025-12-23 |
| Phase 7: Promotion UI | ⏳ To Do | 0% | 2-3h | - | - |
| **Total** | **🚧 In Progress** | **85%** | **14-16h** | **~15h** | **-** |

**Legend**:
- ⏳ To Do
- 🚧 In Progress
- ✅ Done
- ❌ Blocked

---

## User Flows

### Shop Owner Flow
1. Create a shop → Automatically assigned "shop-owner" role
2. Add vendors to shop by user ID
3. Create products for the shop
4. Associate products with channels
5. Monitor which vendors are promoting products

### Vendor Flow
1. Get assigned as vendor to a shop by shop owner
2. View assigned shops and their products
3. Join a channel
4. Select products to promote during the channel session
5. Toggle products on/off in real-time

### Viewer Flow
1. Join a channel
2. See promoted products displayed in the channel
3. View product details (name, price, image)
4. See which vendor is promoting each product

---

## Technical Decisions

### Role System
- **user_shop_roles** junction table allows:
  - One user to have multiple roles across different shops
  - One user to have multiple roles in the same shop (e.g., owner + vendor)
  - Flexible role expansion in the future (e.g., "manager", "analyst")

### Product-Channel Association
- Products are associated at the **channel level** (not shop level)
- This allows shop owners to curate which products are available per channel
- Vendors can only promote products that are already associated with the channel

### Promotion Tracking
- **vendor_promoted_products** tracks:
  - Who promoted what and when
  - Historical data via `unpromoted_at` timestamp
  - Enables analytics and reporting

---

## Security Considerations

### Access Control
- Shop owners can only manage their own shops
- Vendors can only create/edit products for shops where they have vendor role
- Vendors can only promote products from their associated shops
- All operations require authentication

### Data Validation
- Shop names must be unique per owner (business rule)
- Product prices must be non-negative
- Image URLs validated for format
- User IDs validated before vendor assignment

---

## Testing Plan

### Unit Tests (Future)
- Shop router procedures
- Product router procedures
- Vendor promotion logic
- Role validation middleware

### Integration Tests (Future)
- Full shop lifecycle (create → add vendors → create products → associate → promote)
- Multi-shop scenarios
- Role-based access control

### Manual Testing
- [ ] Create shop as authenticated user
- [ ] Add vendor to shop
- [ ] Create product as shop owner
- [ ] Create product as vendor
- [ ] Associate product with channel
- [ ] Vendor promotes product in channel
- [ ] Multiple vendors promote different products
- [ ] Viewers see promoted products in real-time
- [ ] Update/delete operations work correctly
- [ ] Access control enforced (non-vendors can't promote)

---

## Future Enhancements

### Short Term
- [ ] Product categories/tags
- [ ] Product inventory tracking
- [ ] Product search and filtering
- [ ] Bulk product upload (CSV)

### Medium Term
- [ ] Product analytics (views, clicks, promotions)
- [ ] Commission tracking for vendors
- [ ] Product reviews and ratings
- [ ] Shopping cart integration

### Long Term
- [ ] Payment integration (Stripe, PayPal)
- [ ] Order management system
- [ ] Vendor payout automation
- [ ] AI-powered product recommendations

---

## Dependencies

### External Libraries
- None (using existing stack)

### Feature Dependencies
- **Feature 001**: Live Streaming Channels (must be completed)
- Requires working channel system
- Requires authentication system

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-23 | 1.0 | Initial feature documentation | Assistant |

---

## Notes

- Consider adding shop branding (logo, colors) in future iterations
- Product images should be optimized/resized on upload
- Monitor database size as product count grows
- Consider pagination for large product lists
- Rate limiting for product creation to prevent spam

---

**Last Updated**: 2025-12-23  
**Status**: 🚧 Phase 7 Remaining - Vendor Promotion UI

# Phase 6: Frontend - Product Management UI

**Status**: 🚧 In Progress  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 3, Phase 5 completed

---

## Objectives

Create comprehensive product management UI for shop owners and vendors:
- List products by shop
- Create new products
- Edit existing products
- Toggle product active status
- Associate products with channels
- View channel associations
- Image upload/URL support

---

## Implementation Tasks

### 1. Product List Page
**File**: `client/src/pages/ProductsPage.tsx`

**Features**:
- [ ] Display products in responsive grid
- [ ] Filter by shop (dropdown)
- [ ] Show product card with image, name, price, status
- [ ] "Create Product" button
- [ ] Empty state when no products
- [ ] Click to edit product
- [ ] Visual indicator for active/inactive products
- [ ] Loading states

### 2. Create Product Page
**File**: `client/src/pages/CreateProductPage.tsx`

**Features**:
- [ ] Form with fields: name, description, price, image_url
- [ ] Shop selection dropdown
- [ ] Input validation
- [ ] Image preview from URL
- [ ] Success/error toasts
- [ ] Redirect to products list on success
- [ ] Cancel button

### 3. Edit Product Page
**File**: `client/src/pages/EditProductPage.tsx`

**Features**:
- [ ] Pre-filled form with existing product data
- [ ] Update product details
- [ ] Toggle active status
- [ ] Delete product with confirmation
- [ ] Associate with channels section
- [ ] List current channel associations
- [ ] Success/error handling

### 4. Product Card Component
**File**: `client/src/components/ProductCard/ProductCard.tsx`

**Features**:
- [ ] Product image with fallback
- [ ] Product name and description (truncated)
- [ ] Price display (formatted)
- [ ] Active/Inactive badge
- [ ] Shop name
- [ ] Click handler to navigate to edit

### 5. Associate Product to Channel Modal
**File**: `client/src/components/AssociateProductModal/AssociateProductModal.tsx`

**Features**:
- [ ] Modal overlay
- [ ] Channel dropdown/search
- [ ] Associate button
- [ ] List of current associations
- [ ] Remove association button
- [ ] Close modal handler

---

## Router Updates

### App.tsx
Add routes:
```typescript
<Route path="/shops/:shopId/products" element={<ProductsPage />} />
<Route path="/shops/:shopId/products/create" element={<CreateProductPage />} />
<Route path="/products/:id/edit" element={<EditProductPage />} />
```

---

## API Integration

Use tRPC hooks from Phase 3:
- `trpc.product.list.useQuery()` - List products by shop
- `trpc.product.get.useQuery()` - Get product details
- `trpc.product.create.useMutation()` - Create product
- `trpc.product.update.useMutation()` - Update product
- `trpc.product.delete.useMutation()` - Delete product
- `trpc.product.associateToChannel.useMutation()` - Link to channel
- `trpc.product.removeFromChannel.useMutation()` - Unlink from channel
- `trpc.product.listByChannel.useQuery()` - Get channel products

---

## Styling Guidelines

### Design System
- Shadcn UI components (Button, Input, Textarea, Label, Badge)
- Tailwind CSS utilities
- Lucide React icons (Package, Plus, Edit2, Trash2, Link, Unlink, DollarSign, Image)
- Consistent color scheme

### Layout Patterns
- Responsive grid for product cards
- Form layouts with proper spacing
- Modal overlays for associations
- Image placeholders

---

## Validation Rules

### Product Form
- Name: Required, max 255 characters
- Description: Optional, max 1000 characters
- Price: Optional, numeric, >= 0, max 2 decimal places
- Image URL: Optional, valid URL format
- Shop ID: Required (from route or dropdown)

---

## Implementation Checklist

- [ ] Create ProductsPage component
- [ ] Create CreateProductPage component
- [ ] Create EditProductPage component
- [ ] Create ProductCard component
- [ ] Create AssociateProductModal component
- [ ] Add routes to App.tsx
- [ ] Update ShopDetailPage with "Manage Products" link
- [ ] Add "Products" link in shop navigation
- [ ] Test all CRUD operations
- [ ] Test channel associations
- [ ] Test responsive design
- [ ] Test error handling
- [ ] Test loading states

---

## Completion Criteria

- ✅ All pages render correctly
- ✅ Forms validate input
- ✅ CRUD operations work
- ✅ Channel associations work
- ✅ Images display with fallback
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Role-based access control

---

**Status**: 🚧 Ready to implement

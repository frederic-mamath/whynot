# Phase 1: Database Schema & Migrations

**Status**: ⏳ To Do  
**Estimated Time**: 2 hours  
**Dependencies**: None

---

## Objectives

Create all database tables required for the back-office shop feature:
1. Shops
2. User-Shop roles
3. Products
4. Channel-Product associations
5. Vendor product promotions

---

## Migration Files

### 002_create_shops.ts

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('shops')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('owner_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Index for faster owner lookups
  await db.schema
    .createIndex('shops_owner_id_idx')
    .on('shops')
    .column('owner_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('shops').execute();
}
```

---

### 003_create_user_shop_roles.ts

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_shop_roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('shop_id', 'integer', (col) => 
      col.notNull().references('shops.id').onDelete('cascade')
    )
    .addColumn('role', 'varchar(50)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Unique constraint: user can have each role only once per shop
  await db.schema
    .createIndex('user_shop_roles_unique_idx')
    .on('user_shop_roles')
    .columns(['user_id', 'shop_id', 'role'])
    .unique()
    .execute();

  // Index for faster shop role lookups
  await db.schema
    .createIndex('user_shop_roles_shop_id_idx')
    .on('user_shop_roles')
    .column('shop_id')
    .execute();

  // Index for faster user role lookups
  await db.schema
    .createIndex('user_shop_roles_user_id_idx')
    .on('user_shop_roles')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_shop_roles').execute();
}
```

---

### 004_create_products.ts

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('shop_id', 'integer', (col) => 
      col.notNull().references('shops.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('price', 'decimal(10,2)')
    .addColumn('image_url', 'varchar(500)')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Index for faster shop product lookups
  await db.schema
    .createIndex('products_shop_id_idx')
    .on('products')
    .column('shop_id')
    .execute();

  // Index for filtering active products
  await db.schema
    .createIndex('products_is_active_idx')
    .on('products')
    .column('is_active')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('products').execute();
}
```

---

### 005_create_channel_products.ts

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('channel_products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('channel_id', 'integer', (col) => 
      col.notNull().references('channels.id').onDelete('cascade')
    )
    .addColumn('product_id', 'integer', (col) => 
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Unique constraint: product can be associated only once per channel
  await db.schema
    .createIndex('channel_products_unique_idx')
    .on('channel_products')
    .columns(['channel_id', 'product_id'])
    .unique()
    .execute();

  // Index for faster channel product lookups
  await db.schema
    .createIndex('channel_products_channel_id_idx')
    .on('channel_products')
    .column('channel_id')
    .execute();

  // Index for finding channels by product
  await db.schema
    .createIndex('channel_products_product_id_idx')
    .on('channel_products')
    .column('product_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('channel_products').execute();
}
```

---

### 006_create_vendor_promoted_products.ts

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('vendor_promoted_products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('channel_id', 'integer', (col) => 
      col.notNull().references('channels.id').onDelete('cascade')
    )
    .addColumn('vendor_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('product_id', 'integer', (col) => 
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('promoted_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('unpromoted_at', 'timestamp')
    .execute();

  // Index for finding active promotions
  await db.schema
    .createIndex('vendor_promoted_products_active_idx')
    .on('vendor_promoted_products')
    .columns(['channel_id', 'unpromoted_at'])
    .execute();

  // Index for vendor's promotions
  await db.schema
    .createIndex('vendor_promoted_products_vendor_id_idx')
    .on('vendor_promoted_products')
    .column('vendor_id')
    .execute();

  // Index for product promotion history
  await db.schema
    .createIndex('vendor_promoted_products_product_id_idx')
    .on('vendor_promoted_products')
    .column('product_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('vendor_promoted_products').execute();
}
```

---

## Kysely Type Updates

After running migrations, update `src/db/schema.ts` with new table types:

```typescript
export interface Shops {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserShopRoles {
  id: number;
  user_id: number;
  shop_id: number;
  role: 'shop-owner' | 'vendor';
  created_at: Date;
}

export interface Products {
  id: number;
  shop_id: number;
  name: string;
  description: string | null;
  price: string | null; // decimal stored as string
  image_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelProducts {
  id: number;
  channel_id: number;
  product_id: number;
  created_at: Date;
}

export interface VendorPromotedProducts {
  id: number;
  channel_id: number;
  vendor_id: number;
  product_id: number;
  promoted_at: Date;
  unpromoted_at: Date | null;
}

export interface Database {
  users: Users;
  channels: Channels;
  channel_participants: ChannelParticipants;
  shops: Shops;
  user_shop_roles: UserShopRoles;
  products: Products;
  channel_products: ChannelProducts;
  vendor_promoted_products: VendorPromotedProducts;
}
```

---

## Execution Steps

1. Create all 5 migration files in `migrations/` directory
2. Run migrations: `npm run migrate`
3. Verify tables created in PostgreSQL
4. Update `src/db/schema.ts` with new types
5. Restart TypeScript server for type updates

---

## Validation Checklist

- [ ] All migration files created
- [ ] Migrations run without errors
- [ ] Tables exist in database
- [ ] Foreign keys properly set up
- [ ] Indexes created
- [ ] Unique constraints working
- [ ] Kysely types updated
- [ ] TypeScript compilation successful

---

## Testing Queries

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shops', 'user_shop_roles', 'products', 'channel_products', 'vendor_promoted_products');

-- Verify foreign keys
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('shops', 'user_shop_roles', 'products', 'channel_products', 'vendor_promoted_products');

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('shops', 'user_shop_roles', 'products', 'channel_products', 'vendor_promoted_products');
```

---

**Phase 1 Completion Criteria**:
✅ All 5 tables created  
✅ All foreign keys and indexes in place  
✅ Kysely types updated  
✅ No migration errors  
✅ Ready for Phase 2 (Backend API development)

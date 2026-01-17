# Phase 2: Backend Implementation

## Objective

Implement the database schema, migrations, repositories, and tRPC API endpoints to support user profile and address management.

## User-Facing Changes

None directly - this phase provides the backend foundation for the profile feature. Users will see the results once the frontend is implemented in Phase 3.

## Files to Update

### Database Migrations

- `migrations/018_add_user_names.ts` - ✅ **Already exists!** (Confirmed from workspace structure)
- `migrations/019_create_user_addresses.ts` - **NEW** Create user_addresses table

### Repositories

- `src/repositories/UserRepository.ts` - **UPDATE** Add methods for updating firstName/lastName
- `src/repositories/AddressRepository.ts` - **NEW** Create address CRUD operations

### tRPC Routers

- `src/routers/profileRouter.ts` - **NEW** Create profile router with all endpoints

### Types

- `src/types/profile.ts` - **NEW** TypeScript types for profile and addresses

### Integration

- `src/trpc.ts` - **UPDATE** Register profileRouter

## Steps

### Step 1: Create User Addresses Migration

**File**: `migrations/019_create_user_addresses.ts`

```typescript
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user_addresses")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) =>
      col.references("users.id").onDelete("cascade").notNull(),
    )
    .addColumn("label", "varchar(30)", (col) => col.notNull())
    .addColumn("street", "varchar(100)", (col) => col.notNull())
    .addColumn("street2", "varchar(100)")
    .addColumn("city", "varchar(50)", (col) => col.notNull())
    .addColumn("state", "varchar(2)", (col) => col.notNull())
    .addColumn("zip_code", "varchar(10)", (col) => col.notNull())
    .addColumn("country", "varchar(2)", (col) => col.defaultTo("US").notNull())
    .addColumn("is_default", "boolean", (col) => col.defaultTo(false).notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create index on user_id for faster queries
  await db.schema
    .createIndex("user_addresses_user_id_idx")
    .on("user_addresses")
    .column("user_id")
    .execute();

  // Create unique constraint: only one default address per user
  await db.schema
    .createIndex("user_addresses_user_id_is_default_idx")
    .on("user_addresses")
    .columns(["user_id", "is_default"])
    .unique()
    .where("is_default", "=", true)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("user_addresses").execute();
}
```

**Run migration**:

```bash
npm run migrate
```

### Step 2: Create TypeScript Types

**File**: `src/types/profile.ts`

```typescript
export interface UserAddress {
  id: number;
  userId: number;
  label: string;
  street: string;
  street2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressInput {
  label: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  id: number;
  label?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UpdatePersonalInfoInput {
  firstName: string;
  lastName: string;
}
```

### Step 3: Update UserRepository

**File**: `src/repositories/UserRepository.ts`

Add methods:

```typescript
async updatePersonalInfo(userId: number, data: {
  firstName: string;
  lastName: string;
}): Promise<User> {
  const updated = await this.db
    .updateTable("users")
    .set({
      first_name: data.firstName,
      last_name: data.lastName,
      updated_at: new Date(),
    })
    .where("id", "=", userId)
    .returningAll()
    .executeTakeFirstOrThrow();

  return this.mapToUser(updated);
}

async findById(userId: number): Promise<User | null> {
  const user = await this.db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", userId)
    .executeTakeFirst();

  return user ? this.mapToUser(user) : null;
}
```

### Step 4: Create AddressRepository

**File**: `src/repositories/AddressRepository.ts`

```typescript
import { Kysely, sql } from "kysely";
import { Database } from "../db/types";
import { UserAddress } from "../types/profile";

export class AddressRepository {
  constructor(private db: Kysely<Database>) {}

  async findByUserId(userId: number): Promise<UserAddress[]> {
    const addresses = await this.db
      .selectFrom("user_addresses")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("is_default", "desc")
      .orderBy("created_at", "desc")
      .execute();

    return addresses.map(this.mapToUserAddress);
  }

  async findById(id: number, userId: number): Promise<UserAddress | null> {
    const address = await this.db
      .selectFrom("user_addresses")
      .selectAll()
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return address ? this.mapToUserAddress(address) : null;
  }

  async create(userId: number, data: CreateAddressInput): Promise<UserAddress> {
    // If setting as default, unset previous default first
    if (data.isDefault) {
      await this.unsetDefaultAddress(userId);
    }

    const created = await this.db
      .insertInto("user_addresses")
      .values({
        user_id: userId,
        label: data.label,
        street: data.street,
        street2: data.street2 || null,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        country: data.country,
        is_default: data.isDefault || false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToUserAddress(created);
  }

  async update(
    id: number,
    userId: number,
    data: UpdateAddressInput,
  ): Promise<UserAddress> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.label) updateData.label = data.label;
    if (data.street) updateData.street = data.street;
    if (data.street2 !== undefined) updateData.street2 = data.street2 || null;
    if (data.city) updateData.city = data.city;
    if (data.state) updateData.state = data.state;
    if (data.zipCode) updateData.zip_code = data.zipCode;
    if (data.country) updateData.country = data.country;

    const updated = await this.db
      .updateTable("user_addresses")
      .set(updateData)
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToUserAddress(updated);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.db
      .deleteFrom("user_addresses")
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .execute();
  }

  async setDefaultAddress(id: number, userId: number): Promise<UserAddress> {
    // Unset previous default
    await this.unsetDefaultAddress(userId);

    // Set new default
    const updated = await this.db
      .updateTable("user_addresses")
      .set({ is_default: true, updated_at: new Date() })
      .where("id", "=", id)
      .where("user_id", "=", userId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapToUserAddress(updated);
  }

  private async unsetDefaultAddress(userId: number): Promise<void> {
    await this.db
      .updateTable("user_addresses")
      .set({ is_default: false, updated_at: new Date() })
      .where("user_id", "=", userId)
      .where("is_default", "=", true)
      .execute();
  }

  private mapToUserAddress(row: any): UserAddress {
    return {
      id: row.id,
      userId: row.user_id,
      label: row.label,
      street: row.street,
      street2: row.street2,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      country: row.country,
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

### Step 5: Create Profile Router

**File**: `src/routers/profileRouter.ts`

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { UserRepository } from "../repositories/UserRepository";
import { AddressRepository } from "../repositories/AddressRepository";

export const profileRouter = router({
  // Get current user profile
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const userRepo = new UserRepository(ctx.db);
    const user = await userRepo.findById(ctx.user.id);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }),

  // Update personal info (first name, last name)
  updatePersonalInfo: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userRepo = new UserRepository(ctx.db);
      const updated = await userRepo.updatePersonalInfo(ctx.user.id, input);

      return {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
      };
    }),

  // List all addresses for current user
  listAddresses: protectedProcedure.query(async ({ ctx }) => {
    const addressRepo = new AddressRepository(ctx.db);
    return addressRepo.findByUserId(ctx.user.id);
  }),

  // Create new address
  createAddress: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1).max(30),
        street: z.string().min(1).max(100),
        street2: z.string().max(100).optional(),
        city: z.string().min(1).max(50),
        state: z.string().length(2),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
        country: z.string().length(2).default("US"),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const addressRepo = new AddressRepository(ctx.db);
      return addressRepo.create(ctx.user.id, input);
    }),

  // Update existing address
  updateAddress: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        label: z.string().min(1).max(30).optional(),
        street: z.string().min(1).max(100).optional(),
        street2: z.string().max(100).optional(),
        city: z.string().min(1).max(50).optional(),
        state: z.string().length(2).optional(),
        zipCode: z
          .string()
          .regex(/^\d{5}(-\d{4})?$/)
          .optional(),
        country: z.string().length(2).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const addressRepo = new AddressRepository(ctx.db);

      // Verify address belongs to user
      const existing = await addressRepo.findById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      const { id, ...updateData } = input;
      return addressRepo.update(id, ctx.user.id, updateData);
    }),

  // Delete address
  deleteAddress: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const addressRepo = new AddressRepository(ctx.db);

      // Verify address belongs to user
      const existing = await addressRepo.findById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      // Check if it's the only address
      const allAddresses = await addressRepo.findByUserId(ctx.user.id);
      if (allAddresses.length === 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your only address",
        });
      }

      // If deleting default address, set another as default
      if (existing.isDefault) {
        const otherAddress = allAddresses.find((a) => a.id !== input.id);
        if (otherAddress) {
          await addressRepo.setDefaultAddress(otherAddress.id, ctx.user.id);
        }
      }

      await addressRepo.delete(input.id, ctx.user.id);
      return { success: true };
    }),

  // Set address as default
  setDefaultAddress: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const addressRepo = new AddressRepository(ctx.db);

      // Verify address belongs to user
      const existing = await addressRepo.findById(input.id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      return addressRepo.setDefaultAddress(input.id, ctx.user.id);
    }),
});
```

### Step 6: Register Profile Router

**File**: `src/trpc.ts`

```typescript
import { profileRouter } from "./routers/profileRouter";

export const appRouter = router({
  auth: authRouter,
  channel: channelRouter,
  product: productRouter,
  auction: auctionRouter,
  // ... other routers
  profile: profileRouter, // ADD THIS
});
```

## Design Considerations

### Data Integrity

- **Unique default address**: The database constraint ensures only one address per user can be default
- **Cascade deletion**: When a user is deleted, all their addresses are automatically deleted
- **Transaction safety**: Setting a default address uses atomic operations to prevent race conditions

### Validation

- All inputs validated with Zod schemas
- ZIP code format validated (5 or 9 digits)
- State codes limited to 2 characters
- String lengths enforced at database and validation layers

### Security

- All endpoints protected with `protectedProcedure` (requires authentication)
- Users can only access/modify their own addresses
- Address ownership verified before any update/delete operation

### Performance

- Index on `user_id` for fast address lookups
- Addresses ordered by default status, then creation date
- Minimal database queries (no N+1 issues)

### Error Handling

- Clear error messages for validation failures
- Proper HTTP status codes via tRPC errors
- Cannot delete only address
- Auto-promote another address when deleting default

## Acceptance Criteria

- [ ] Migration 019 created and runs successfully
- [ ] `user_addresses` table exists with proper schema
- [ ] Unique constraint on default address works
- [ ] AddressRepository implements all CRUD operations
- [ ] UserRepository can update firstName/lastName
- [ ] Profile router registered in tRPC
- [ ] All endpoints protected by authentication
- [ ] Input validation works with Zod
- [ ] Cannot have multiple default addresses per user
- [ ] Deleting default address auto-promotes another
- [ ] Cannot delete only address
- [ ] Address ownership verified before operations

## Testing Checklist

- [ ] Run migration locally
- [ ] Test creating address via Postman/tRPC panel
- [ ] Test setting multiple addresses
- [ ] Test switching default address
- [ ] Test deleting non-default address
- [ ] Test deleting default address (should promote another)
- [ ] Test preventing deletion of only address
- [ ] Test unauthorized access (different user's address)
- [ ] Test validation errors (invalid ZIP, etc.)

## Status

📝 **PLANNING** - Ready to implement

## Notes

- Migration 018 already exists for adding `firstName` and `lastName` to users table
- Consider rate limiting address creation in production (max 10 addresses per user?)
- Future: Add address verification service integration
- Consider adding `phone` field to addresses for delivery notifications

# Phase 1: Architecture Design & Base Classes

## Objective
Create the foundational repository infrastructure including base classes, interfaces, and type definitions that all repositories will extend.

## Repository Pattern Explained

The Repository Pattern provides an abstraction layer between your business logic (routers) and data access logic (database queries). Think of it as a "storage manager" for each entity type.

### Key Concepts:

1. **Repository = Data Manager**: One repository per entity (User, Shop, Product, etc.)
2. **Encapsulation**: All database queries for an entity live in its repository
3. **Interface**: Repositories expose simple methods like `create()`, `findById()`, `update()`
4. **Separation**: Routers don't know about SQL - they just call repository methods

### Example Flow:

```
Router (Business Logic)
    ↓ calls
Repository (Data Access Layer)
    ↓ executes
Database (Kysely queries)
```

## Files to Create

### 1. `src/repositories/base/types.ts`
Type definitions for repository operations.

```typescript
import { Selectable, Insertable, Updateable } from 'kysely';

/**
 * Generic repository interface
 * T = Table type (e.g., UsersTable)
 */
export interface IRepository<T> {
  findById(id: number): Promise<Selectable<T> | undefined>;
  findAll(): Promise<Selectable<T>[]>;
  create(data: Insertable<T>): Promise<Selectable<T>>;
  update(id: number, data: Updateable<T>): Promise<Selectable<T> | undefined>;
  delete(id: number): Promise<boolean>;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Filter criteria for queries
 */
export type FilterCriteria<T> = Partial<T>;
```

### 2. `src/repositories/base/BaseRepository.ts`
Abstract base class with common CRUD operations.

```typescript
import { db } from '../../db';
import { Selectable, Insertable, Updateable } from 'kysely';
import { IRepository } from './types';

/**
 * Base repository with generic CRUD operations
 * Extend this for entity-specific repositories
 */
export abstract class BaseRepository<Table, TableName extends keyof Database> 
  implements IRepository<Table> {
  
  constructor(protected tableName: TableName) {}

  /**
   * Find entity by ID
   */
  async findById(id: number): Promise<Selectable<Table> | undefined> {
    return db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as Promise<Selectable<Table> | undefined>;
  }

  /**
   * Find all entities
   */
  async findAll(limit?: number): Promise<Selectable<Table>[]> {
    let query = db
      .selectFrom(this.tableName)
      .selectAll();
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query.execute() as Promise<Selectable<Table>[]>;
  }

  /**
   * Create new entity
   */
  async create(data: Insertable<Table>): Promise<Selectable<Table>> {
    return db
      .insertInto(this.tableName)
      .values({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<Selectable<Table>>;
  }

  /**
   * Update entity by ID
   */
  async update(
    id: number,
    data: Updateable<Table>
  ): Promise<Selectable<Table> | undefined> {
    return db
      .updateTable(this.tableName)
      .set({
        ...data,
        updated_at: new Date(),
      } as any)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst() as Promise<Selectable<Table> | undefined>;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom(this.tableName)
      .where('id', '=', id)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Check if entity exists
   */
  async exists(id: number): Promise<boolean> {
    const result = await db
      .selectFrom(this.tableName)
      .select(['id'])
      .where('id', '=', id)
      .executeTakeFirst();
    
    return result !== undefined;
  }

  /**
   * Count total entities
   */
  async count(): Promise<number> {
    const result = await db
      .selectFrom(this.tableName)
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    
    return Number(result.count);
  }
}
```

### 3. `src/repositories/index.ts`
Central export file for all repositories (will grow in later phases).

```typescript
/**
 * Repository layer exports
 * Repositories encapsulate all database access logic
 */

// Base classes and types
export * from './base/types';
export * from './base/BaseRepository';

// Repository instances will be added in later phases
// Example:
// export { userRepository } from './UserRepository';
// export { shopRepository } from './ShopRepository';
```

## Directory Structure

```
src/repositories/
├── base/
│   ├── BaseRepository.ts    # Abstract base class
│   └── types.ts             # Shared types/interfaces
└── index.ts                 # Barrel exports
```

## Implementation Steps

### Step 1: Create Directory Structure
```bash
mkdir -p src/repositories/base
touch src/repositories/base/types.ts
touch src/repositories/base/BaseRepository.ts
touch src/repositories/index.ts
```

### Step 2: Implement Base Types
- Define `IRepository` interface
- Define `PaginationOptions` and `FilterCriteria` types
- Add JSDoc comments for documentation

### Step 3: Implement BaseRepository
- Create abstract class with generic CRUD methods
- Use Kysely's `Selectable`, `Insertable`, `Updateable` types
- Add timestamp handling (created_at, updated_at)
- Implement common utilities (exists, count)

### Step 4: Create Export Barrel
- Set up `index.ts` for clean imports
- Document the repository pattern

### Step 5: Validation
- Ensure TypeScript compiles without errors
- Verify imports work correctly
- No runtime code yet - just infrastructure

## Design Decisions

### Why Abstract Base Class?
- Provides common CRUD operations all repositories need
- Reduces code duplication
- Enforces consistent patterns

### Why Generic Types?
- Type safety for all database operations
- IntelliSense support in IDEs
- Catch errors at compile time

### Why Timestamps in Base?
- Every table has created_at/updated_at
- Automatic timestamp management
- Consistent across all entities

## Validation

- [ ] `src/repositories/base/types.ts` exists with proper interfaces
- [ ] `src/repositories/base/BaseRepository.ts` exists with base class
- [ ] `src/repositories/index.ts` exports base classes
- [ ] TypeScript compiles without errors
- [ ] No breaking changes to existing code
- [ ] Documentation is clear and complete

## Acceptance Criteria

- ✅ Repository base infrastructure is ready
- ✅ Generic CRUD operations defined
- ✅ Type-safe interfaces created
- ✅ Export structure established
- ✅ Code is well-documented
- ✅ Foundation ready for entity-specific repositories

## Estimated Time
**2 hours**

## Status
⏳ **PENDING**

## Notes
- This phase creates no functional changes
- All code is infrastructure for later phases
- Focus on type safety and reusability
- Documentation is crucial for team understanding

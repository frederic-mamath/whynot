import { db } from '../db';
import { Selectable } from 'kysely';
import { ShopsTable } from '../db/types';

type Shop = Selectable<ShopsTable>;

/**
 * ShopRepository - Spring Data JPA style
 * Handles all shop-related database operations
 */
export class ShopRepository {
  
  /**
   * Find shop by ID
   * Similar to: SELECT * FROM shops WHERE id = ?
   */
  async findById(id: number): Promise<Shop | undefined> {
    return db
      .selectFrom('shops')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Find shops owned by a specific user
   * Similar to: SELECT * FROM shops WHERE owner_id = ? ORDER BY created_at DESC
   */
  async findByOwnerId(userId: number): Promise<Shop[]> {
    return db
      .selectFrom('shops')
      .selectAll()
      .where('owner_id', '=', userId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  /**
   * Find shops where user has any role (owner or vendor)
   * Includes the role information
   * Similar to: SELECT shops.*, usr.role FROM shops 
   *             INNER JOIN user_shop_roles usr ON usr.shop_id = shops.id 
   *             WHERE usr.user_id = ?
   */
  async findByUserWithRole(userId: number): Promise<Array<Shop & { role: 'shop-owner' | 'vendor' }>> {
    return db
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
      .where('user_shop_roles.user_id', '=', userId)
      .execute() as Promise<Array<Shop & { role: 'shop-owner' | 'vendor' }>>;
  }

  /**
   * Create new shop
   * Similar to: INSERT INTO shops (name, description, owner_id, created_at, updated_at) 
   *             VALUES (?, ?, ?, NOW(), NOW())
   */
  async save(data: {
    name: string;
    description: string | null;
    owner_id: number;
  }): Promise<Shop> {
    return db
      .insertInto('shops')
      .values({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Update shop details
   * Similar to: UPDATE shops SET name = ?, description = ?, updated_at = NOW() WHERE id = ?
   */
  async updateById(
    shopId: number,
    data: {
      name?: string;
      description?: string | null;
    }
  ): Promise<Shop | undefined> {
    return db
      .updateTable('shops')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', shopId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Delete shop
   * Similar to: DELETE FROM shops WHERE id = ?
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('shops')
      .where('id', '=', id)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Check if shop exists
   * Similar to: SELECT EXISTS(SELECT 1 FROM shops WHERE id = ?)
   */
  async existsById(id: number): Promise<boolean> {
    const result = await db
      .selectFrom('shops')
      .select(['id'])
      .where('id', '=', id)
      .executeTakeFirst();
    
    return result !== undefined;
  }
}

// Export singleton instance
export const shopRepository = new ShopRepository();

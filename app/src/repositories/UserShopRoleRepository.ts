import { db } from '../db';
import { Selectable } from 'kysely';
import { UserShopRolesTable } from '../db/types';

type UserShopRole = Selectable<UserShopRolesTable>;

/**
 * UserShopRoleRepository - Spring Data JPA style
 * Handles shop role assignments and permissions
 */
export class UserShopRoleRepository {
  
  /**
   * Assign role to user in shop
   * Similar to: INSERT INTO user_shop_roles (user_id, shop_id, role, created_at) 
   *             VALUES (?, ?, ?, NOW())
   */
  async assignRole(
    userId: number,
    shopId: number,
    role: 'shop-owner' | 'vendor'
  ): Promise<UserShopRole> {
    return db
      .insertInto('user_shop_roles')
      .values({
        user_id: userId,
        shop_id: shopId,
        role,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Get user's role in a shop
   * Similar to: SELECT * FROM user_shop_roles WHERE user_id = ? AND shop_id = ?
   */
  async getUserRole(
    userId: number,
    shopId: number
  ): Promise<UserShopRole | undefined> {
    return db
      .selectFrom('user_shop_roles')
      .selectAll()
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .executeTakeFirst();
  }

  /**
   * Check if user is shop owner
   * Similar to: SELECT EXISTS(SELECT 1 FROM user_shop_roles 
   *             WHERE user_id = ? AND shop_id = ? AND role = 'shop-owner')
   */
  async isShopOwner(userId: number, shopId: number): Promise<boolean> {
    const role = await db
      .selectFrom('user_shop_roles')
      .select(['role'])
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .where('role', '=', 'shop-owner')
      .executeTakeFirst();
    
    return role !== undefined;
  }

  /**
   * Check if user has any access to shop (owner or vendor)
   * Similar to: SELECT EXISTS(SELECT 1 FROM user_shop_roles 
   *             WHERE user_id = ? AND shop_id = ?)
   */
  async hasShopAccess(userId: number, shopId: number): Promise<boolean> {
    const role = await this.getUserRole(userId, shopId);
    return role !== undefined;
  }

  /**
   * Check if user already has a specific role in shop
   * Similar to: SELECT EXISTS(SELECT 1 FROM user_shop_roles 
   *             WHERE user_id = ? AND shop_id = ? AND role = ?)
   */
  async existsByUserAndShopAndRole(
    userId: number,
    shopId: number,
    role: 'shop-owner' | 'vendor'
  ): Promise<boolean> {
    const result = await db
      .selectFrom('user_shop_roles')
      .select(['id'])
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .where('role', '=', role)
      .executeTakeFirst();
    
    return result !== undefined;
  }

  /**
   * Remove user's role from shop
   * Similar to: DELETE FROM user_shop_roles WHERE user_id = ? AND shop_id = ? AND role = ?
   */
  async removeRole(
    userId: number,
    shopId: number,
    role: 'shop-owner' | 'vendor'
  ): Promise<boolean> {
    const result = await db
      .deleteFrom('user_shop_roles')
      .where('user_id', '=', userId)
      .where('shop_id', '=', shopId)
      .where('role', '=', role)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Find all vendors for a shop
   * Similar to: SELECT * FROM user_shop_roles WHERE shop_id = ? AND role = 'vendor'
   */
  async findVendorsByShop(shopId: number): Promise<UserShopRole[]> {
    return db
      .selectFrom('user_shop_roles')
      .selectAll()
      .where('shop_id', '=', shopId)
      .where('role', '=', 'vendor')
      .execute();
  }
}

// Export singleton instance
export const userShopRoleRepository = new UserShopRoleRepository();

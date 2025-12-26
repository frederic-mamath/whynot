import { db } from '../db';
import { Selectable } from 'kysely';
import { ProductsTable } from '../db/types';

type Product = Selectable<ProductsTable>;

/**
 * ProductRepository - Spring Data JPA style
 * Handles all product-related database operations
 */
export class ProductRepository {
  
  /**
   * Find product by ID
   * Similar to: SELECT * FROM products WHERE id = ?
   */
  async findById(id: number): Promise<Product | undefined> {
    return db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * Find all products for a shop
   * Similar to: SELECT * FROM products WHERE shop_id = ? ORDER BY created_at DESC
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
   * Similar to: SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC
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
   * Find products by channel
   * Similar to: SELECT p.* FROM products p 
   *             INNER JOIN channel_products cp ON cp.product_id = p.id 
   *             WHERE cp.channel_id = ? AND p.is_active = true
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
   * Create new product
   * Similar to: INSERT INTO products (shop_id, name, description, price, image_url, is_active, created_at, updated_at) 
   *             VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
   */
  async save(data: {
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
   * Similar to: UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, is_active = ?, updated_at = NOW() 
   *             WHERE id = ?
   */
  async updateById(
    productId: number,
    data: {
      name?: string;
      description?: string | null;
      price?: string | null;
      image_url?: string | null;
      is_active?: boolean;
    }
  ): Promise<Product | undefined> {
    return db
      .updateTable('products')
      .set({
        ...data,
        updated_at: new Date(),
      })
      .where('id', '=', productId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Set product active status (soft delete)
   * Similar to: UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?
   */
  async setActive(productId: number, isActive: boolean): Promise<Product | undefined> {
    return this.updateById(productId, { is_active: isActive });
  }

  /**
   * Delete product
   * Similar to: DELETE FROM products WHERE id = ?
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom('products')
      .where('id', '=', id)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Get product's shop ID
   * Similar to: SELECT shop_id FROM products WHERE id = ?
   */
  async getShopId(productId: number): Promise<number | undefined> {
    const result = await db
      .selectFrom('products')
      .select(['shop_id'])
      .where('id', '=', productId)
      .executeTakeFirst();
    
    return result?.shop_id;
  }

  /**
   * Check if product belongs to shop
   * Similar to: SELECT EXISTS(SELECT 1 FROM products WHERE id = ? AND shop_id = ?)
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
}

// Export singleton instance
export const productRepository = new ProductRepository();

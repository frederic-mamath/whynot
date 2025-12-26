import { db } from '../db';
import { Selectable } from 'kysely';
import { ChannelProductsTable } from '../db/types';

type ChannelProduct = Selectable<ChannelProductsTable>;

/**
 * ChannelProductRepository - Spring Data JPA style
 * Handles product-channel associations
 */
export class ChannelProductRepository {
  
  /**
   * Associate product with channel
   * Similar to: INSERT INTO channel_products (channel_id, product_id, created_at) 
   *             VALUES (?, ?, NOW())
   */
  async associate(channelId: number, productId: number): Promise<ChannelProduct> {
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
   * Similar to: DELETE FROM channel_products WHERE channel_id = ? AND product_id = ?
   */
  async remove(channelId: number, productId: number): Promise<boolean> {
    const result = await db
      .deleteFrom('channel_products')
      .where('channel_id', '=', channelId)
      .where('product_id', '=', productId)
      .executeTakeFirst();
    
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Check if product is associated with channel
   * Similar to: SELECT EXISTS(SELECT 1 FROM channel_products WHERE channel_id = ? AND product_id = ?)
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
   * Similar to: SELECT * FROM channel_products WHERE channel_id = ?
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
   * Similar to: SELECT * FROM channel_products WHERE product_id = ?
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
   * Similar to: DELETE FROM channel_products WHERE channel_id = ?
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
   * Similar to: DELETE FROM channel_products WHERE product_id = ?
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

import { db } from '../db';
import { Selectable } from 'kysely';
import { VendorPromotedProductsTable } from '../db/types';

type VendorPromotedProduct = Selectable<VendorPromotedProductsTable>;

/**
 * VendorPromotedProductRepository - Spring Data JPA style
 * Handles vendor product promotions in channels
 */
export class VendorPromotedProductRepository {
  
  /**
   * Promote a product in a channel
   * Similar to: INSERT INTO vendor_promoted_products (channel_id, vendor_id, product_id, promoted_at) 
   *             VALUES (?, ?, ?, NOW())
   */
  async promote(
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
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Unpromote a product (set unpromoted_at timestamp)
   * Similar to: UPDATE vendor_promoted_products SET unpromoted_at = NOW() 
   *             WHERE channel_id = ? AND vendor_id = ? AND product_id = ? AND unpromoted_at IS NULL
   */
  async unpromote(
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
    
    return Number(result.numUpdatedRows) > 0;
  }

  /**
   * Check if vendor is currently promoting a product in a channel
   * Similar to: SELECT EXISTS(SELECT 1 FROM vendor_promoted_products 
   *             WHERE channel_id = ? AND vendor_id = ? AND product_id = ? AND unpromoted_at IS NULL)
   */
  async isPromoting(
    channelId: number,
    vendorId: number,
    productId: number
  ): Promise<boolean> {
    const promotion = await db
      .selectFrom('vendor_promoted_products')
      .select(['id'])
      .where('channel_id', '=', channelId)
      .where('vendor_id', '=', vendorId)
      .where('product_id', '=', productId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
    
    return promotion !== undefined;
  }

  /**
   * Get all active promotions for a channel
   * Similar to: SELECT * FROM vendor_promoted_products 
   *             WHERE channel_id = ? AND unpromoted_at IS NULL ORDER BY promoted_at DESC
   */
  async findActiveByChannel(channelId: number): Promise<VendorPromotedProduct[]> {
    return db
      .selectFrom('vendor_promoted_products')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('unpromoted_at', 'is', null)
      .orderBy('promoted_at', 'desc')
      .execute();
  }

  /**
   * Get all active promotions by a vendor in a channel
   * Similar to: SELECT * FROM vendor_promoted_products 
   *             WHERE channel_id = ? AND vendor_id = ? AND unpromoted_at IS NULL
   */
  async findActiveByChannelAndVendor(
    channelId: number,
    vendorId: number
  ): Promise<VendorPromotedProduct[]> {
    return db
      .selectFrom('vendor_promoted_products')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('vendor_id', '=', vendorId)
      .where('unpromoted_at', 'is', null)
      .execute();
  }

  /**
   * Get promotion history for a product in a channel
   * Similar to: SELECT * FROM vendor_promoted_products 
   *             WHERE channel_id = ? AND product_id = ? ORDER BY promoted_at DESC
   */
  async findByChannelAndProduct(
    channelId: number,
    productId: number
  ): Promise<VendorPromotedProduct[]> {
    return db
      .selectFrom('vendor_promoted_products')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('product_id', '=', productId)
      .orderBy('promoted_at', 'desc')
      .execute();
  }

  /**
   * Unpromote all products for a vendor in a channel
   * Similar to: UPDATE vendor_promoted_products SET unpromoted_at = NOW() 
   *             WHERE channel_id = ? AND vendor_id = ? AND unpromoted_at IS NULL
   */
  async unpromoteAllByVendor(channelId: number, vendorId: number): Promise<number> {
    const result = await db
      .updateTable('vendor_promoted_products')
      .set({ unpromoted_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('vendor_id', '=', vendorId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numUpdatedRows);
  }

  /**
   * Unpromote all products in a channel (when channel ends)
   * Similar to: UPDATE vendor_promoted_products SET unpromoted_at = NOW() 
   *             WHERE channel_id = ? AND unpromoted_at IS NULL
   */
  async unpromoteAllByChannel(channelId: number): Promise<number> {
    const result = await db
      .updateTable('vendor_promoted_products')
      .set({ unpromoted_at: new Date() })
      .where('channel_id', '=', channelId)
      .where('unpromoted_at', 'is', null)
      .executeTakeFirst();
    
    return Number(result.numUpdatedRows);
  }
}

// Export singleton instance
export const vendorPromotedProductRepository = new VendorPromotedProductRepository();

import { db } from '../db';
import { Order } from '../db/types';
import { sql } from 'kysely';

export class OrderRepository {
  
  async findById(id: string): Promise<Order | undefined> {
    return db
      .selectFrom('orders')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByBuyerId(buyerId: number): Promise<Order[]> {
    return db
      .selectFrom('orders')
      .selectAll()
      .where('buyer_id', '=', buyerId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async findBySellerId(sellerId: number, status?: string): Promise<Order[]> {
    let query = db
      .selectFrom('orders')
      .selectAll()
      .where('seller_id', '=', sellerId);
    
    if (status) {
      query = query.where('payment_status', '=', status as any);
    }
    
    return query
      .orderBy('created_at', 'desc')
      .execute();
  }

  async findWithDetails(id: string) {
    return db
      .selectFrom('orders')
      .innerJoin('products', 'products.id', 'orders.product_id')
      .innerJoin('users as seller', 'seller.id', 'orders.seller_id')
      .select([
        'orders.id',
        'orders.auction_id',
        'orders.buyer_id',
        'orders.seller_id',
        'orders.product_id',
        'orders.final_price',
        'orders.platform_fee',
        'orders.seller_payout',
        'orders.payment_status',
        'orders.payment_deadline',
        'orders.stripe_payment_intent_id',
        'orders.paid_at',
        'orders.shipped_at',
        'orders.created_at',
        'products.name as product_name',
        'products.image_url as product_image_url',
        'seller.firstname as seller_firstname',
        'seller.lastname as seller_lastname',
      ])
      .where('orders.id', '=', id)
      .executeTakeFirst();
  }

  async create(data: {
    auction_id: string;
    buyer_id: number;
    seller_id: number;
    product_id: number;
    final_price: string;
    platform_fee: string;
    seller_payout: string;
    payment_deadline: Date;
  }): Promise<Order> {
    return db
      .insertInto('orders')
      .values({
        ...data,
        id: sql`gen_random_uuid()`,
        payment_status: 'pending',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updatePaymentStatus(
    id: string, 
    status: 'pending' | 'paid' | 'failed' | 'refunded',
    paidAt?: Date
  ): Promise<Order> {
    return db
      .updateTable('orders')
      .set({ 
        payment_status: status,
        ...(paidAt && { paid_at: paidAt })
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async markAsShipped(id: string): Promise<Order> {
    return db
      .updateTable('orders')
      .set({ shipped_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateStripePaymentIntent(id: string, paymentIntentId: string): Promise<Order> {
    return db
      .updateTable('orders')
      .set({ stripe_payment_intent_id: paymentIntentId })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

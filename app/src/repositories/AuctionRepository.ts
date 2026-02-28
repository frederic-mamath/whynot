import { db } from '../db';
import { Auction } from '../db/types';
import { sql } from 'kysely';

export class AuctionRepository {
  
  async findById(id: string): Promise<Auction | undefined> {
    return db
      .selectFrom('auctions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByChannelId(channelId: number, status?: string): Promise<Auction | undefined> {
    let query = db
      .selectFrom('auctions')
      .selectAll()
      .where('channel_id', '=', channelId);
    
    if (status) {
      query = query.where('status', '=', status as any);
    }
    
    return query
      .orderBy('created_at', 'desc')
      .executeTakeFirst();
  }

  async findActiveByChannelId(channelId: number): Promise<Auction | undefined> {
    return db
      .selectFrom('auctions')
      .selectAll()
      .where('channel_id', '=', channelId)
      .where('status', '=', 'active')
      .executeTakeFirst();
  }

  async findBySellerId(sellerId: number): Promise<Auction[]> {
    return db
      .selectFrom('auctions')
      .selectAll()
      .where('seller_id', '=', sellerId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  async findByShopId(shopId: number): Promise<Auction[]> {
    return db
      .selectFrom('auctions')
      .innerJoin('products', 'products.id', 'auctions.product_id')
      .selectAll('auctions')
      .where('products.shop_id', '=', shopId)
      .where('auctions.status', 'in', ['ended', 'completed', 'paid'])
      .orderBy('auctions.created_at', 'desc')
      .execute();
  }

  async create(data: {
    product_id: number;
    seller_id: number;
    channel_id: number;
    starting_price: string;
    buyout_price: string | null;
    current_bid: string;
    duration_seconds: number;
    started_at: Date;
    ends_at: Date;
  }): Promise<Auction> {
    return db
      .insertInto('auctions')
      .values({
        ...data,
        id: sql`gen_random_uuid()`,
        extended_count: 0,
        status: 'active',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(id: string, data: Partial<{
    current_bid: string;
    highest_bidder_id: number | null;
    ends_at: Date;
    extended_count: number;
    status: 'active' | 'ended' | 'completed' | 'paid' | 'cancelled';
  }>): Promise<Auction> {
    return db
      .updateTable('auctions')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateStatus(id: string, status: 'active' | 'ended' | 'completed' | 'paid' | 'cancelled'): Promise<Auction> {
    return db
      .updateTable('auctions')
      .set({ status })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findWithDetails(id: string) {
    return db
      .selectFrom('auctions')
      .innerJoin('products', 'products.id', 'auctions.product_id')
      .innerJoin('users as seller', 'seller.id', 'auctions.seller_id')
      .leftJoin('users as bidder', 'bidder.id', 'auctions.highest_bidder_id')
      .select([
        'auctions.id',
        'auctions.product_id',
        'auctions.seller_id',
        'auctions.channel_id',
        'auctions.starting_price',
        'auctions.buyout_price',
        'auctions.current_bid',
        'auctions.highest_bidder_id',
        'auctions.duration_seconds',
        'auctions.started_at',
        'auctions.ends_at',
        'auctions.extended_count',
        'auctions.status',
        'auctions.created_at',
        'auctions.updated_at',
        'products.name as product_name',
        'products.image_url as product_image_url',
        'seller.firstname as seller_firstname',
        'seller.lastname as seller_lastname',
        'bidder.firstname as bidder_firstname',
        'bidder.lastname as bidder_lastname',
      ])
      .where('auctions.id', '=', id)
      .executeTakeFirst();
  }
}

import { db } from '../db';
import { Bid } from '../db/types';
import { sql } from 'kysely';

export class BidRepository {
  
  async findByAuctionId(auctionId: string): Promise<Bid[]> {
    return db
      .selectFrom('bids')
      .selectAll()
      .where('auction_id', '=', auctionId)
      .orderBy('placed_at', 'desc')
      .execute();
  }

  async findByAuctionIdWithBidders(auctionId: string) {
    return db
      .selectFrom('bids')
      .innerJoin('users', 'users.id', 'bids.bidder_id')
      .select([
        'bids.id',
        'bids.auction_id',
        'bids.bidder_id',
        'bids.amount',
        'bids.placed_at',
        'bids.created_at',
        'users.firstname as bidder_firstname',
        'users.lastname as bidder_lastname',
      ])
      .where('bids.auction_id', '=', auctionId)
      .orderBy('bids.placed_at', 'desc')
      .execute();
  }

  async findHighestBid(auctionId: string): Promise<Bid | undefined> {
    return db
      .selectFrom('bids')
      .selectAll()
      .where('auction_id', '=', auctionId)
      .orderBy('amount', 'desc')
      .executeTakeFirst();
  }

  async create(data: {
    auction_id: string;
    bidder_id: number;
    amount: string;
  }): Promise<Bid> {
    return db
      .insertInto('bids')
      .values({
        ...data,
        id: sql`gen_random_uuid()`,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findByBidderId(bidderId: number): Promise<Bid[]> {
    return db
      .selectFrom('bids')
      .selectAll()
      .where('bidder_id', '=', bidderId)
      .orderBy('placed_at', 'desc')
      .execute();
  }
}

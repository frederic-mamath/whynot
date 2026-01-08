import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { sql } from 'kysely';
import { 
  auctionRepository, 
  bidRepository, 
  orderRepository,
  productRepository,
  channelRepository,
  userShopRoleRepository
} from '../repositories';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { broadcastToChannel } from '../websocket/broadcast';
import { mapAuctionToOutboundDto } from '../mappers/auction.mapper';
import { mapBidToOutboundDto } from '../mappers/bid.mapper';

async function isChannelHost(channelId: number, userId: number): Promise<boolean> {
  const channel = await db
    .selectFrom('channels')
    .select('host_id')
    .where('id', '=', channelId)
    .executeTakeFirst();
    
  return channel?.host_id === userId;
}

function calculatePlatformFee(finalPrice: number): number {
  return Math.round(finalPrice * 0.07 * 100) / 100;
}

function calculateSellerPayout(finalPrice: number): number {
  return Math.round(finalPrice * 0.93 * 100) / 100;
}

export const auctionRouter = router({
  /**
   * Start a new auction for a highlighted product
   */
  start: protectedProcedure
    .input(z.object({
      productId: z.number(),
      durationSeconds: z.union([
        z.literal(60),
        z.literal(300),
        z.literal(600),
        z.literal(1800)
      ]),
      buyoutPrice: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to start an auction',
        });
      }

      // Get product and verify ownership
      const product = await productRepository.findById(input.productId);
      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        });
      }

      // Verify user has access to this product's shop
      const hasAccess = await userShopRoleRepository.hasShopAccess(ctx.user.id, product.shop_id);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this shop',
        });
      }

      // Find channel where this product is highlighted
      const channel = await db
        .selectFrom('channels')
        .selectAll()
        .where('highlighted_product_id', '=', input.productId)
        .where('status', '=', 'live')
        .executeTakeFirst();

      if (!channel) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Product must be highlighted in a live channel to start auction',
        });
      }

      // Verify user is channel host
      if (!(await isChannelHost(channel.id, ctx.user.id))) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the channel host can start auctions',
        });
      }

      // Check no active auction exists for this channel
      const existingAuction = await auctionRepository.findByChannelId(channel.id, 'active');
      if (existingAuction) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'An auction is already active in this channel',
        });
      }

      const startingPrice = product.price ? parseFloat(product.price) : 0;

      // Validate buyout price
      if (input.buyoutPrice && input.buyoutPrice <= startingPrice) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Buyout price must be greater than starting price',
        });
      }

      // Create auction
      const now = new Date();
      const endsAt = new Date(now.getTime() + input.durationSeconds * 1000);

      const auction = await auctionRepository.create({
        product_id: input.productId,
        seller_id: ctx.user.id,
        channel_id: channel.id,
        starting_price: startingPrice.toFixed(2),
        buyout_price: input.buyoutPrice ? input.buyoutPrice.toFixed(2) : null,
        current_bid: startingPrice.toFixed(2),
        duration_seconds: input.durationSeconds,
        started_at: now,
        ends_at: endsAt,
      });

      // Get auction with details for DTO
      const auctionWithDetails = await auctionRepository.findWithDetails(auction.id);
      if (!auctionWithDetails) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve auction details',
        });
      }

      const auctionDto = mapAuctionToOutboundDto(auctionWithDetails);

      // Broadcast auction started event
      broadcastToChannel(channel.id, {
        type: 'auction:started',
        auction: auctionDto,
      });

      return auctionDto;
    }),

  /**
   * Place a bid on an active auction
   */
  placeBid: protectedProcedure
    .input(z.object({
      auctionId: z.string().uuid(),
      amount: z.number().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to place a bid',
        });
      }

      // Use transaction for race condition safety
      return await db.transaction().execute(async (trx) => {
        // Lock auction row
        const auction = await trx
          .selectFrom('auctions')
          .selectAll()
          .where('id', '=', input.auctionId)
          .forUpdate()
          .executeTakeFirst();

        if (!auction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Auction not found',
          });
        }

        // Verify auction is active
        if (auction.status !== 'active') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Auction is not active',
          });
        }

        // Verify auction hasn't ended
        if (new Date() > auction.ends_at) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Auction has ended',
          });
        }

        // Verify bidder is not the seller
        if (auction.seller_id === ctx.user!.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You cannot bid on your own auction',
          });
        }

        const currentBid = parseFloat(auction.current_bid);
        const minBid = currentBid + 1;

        // Verify bid amount
        if (input.amount < minBid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Bid must be at least $${minBid.toFixed(2)}`,
          });
        }

        // Check if we should extend the auction
        const now = new Date();
        const timeRemaining = auction.ends_at.getTime() - now.getTime();
        const shouldExtend = timeRemaining < 30000; // 30 seconds
        
        let newEndsAt = auction.ends_at;
        let extendedCount = auction.extended_count;
        
        if (shouldExtend) {
          newEndsAt = new Date(auction.ends_at.getTime() + 30000); // Add 30s
          extendedCount += 1;
        }

        // Create bid
        const bid = await trx
          .insertInto('bids')
          .values({
            id: sql`gen_random_uuid()`,
            auction_id: input.auctionId,
            bidder_id: ctx.user!.id,
            amount: input.amount.toFixed(2),
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Update auction
        await trx
          .updateTable('auctions')
          .set({
            current_bid: input.amount.toFixed(2),
            highest_bidder_id: ctx.user!.id,
            ends_at: newEndsAt,
            extended_count: extendedCount,
          })
          .where('id', '=', input.auctionId)
          .execute();

        // Get bidder info for response
        const bidder = await trx
          .selectFrom('users')
          .select(['firstname', 'lastname'])
          .where('id', '=', ctx.user!.id)
          .executeTakeFirst();

        const bidderUsername = bidder?.firstname && bidder.lastname
          ? `${bidder.firstname} ${bidder.lastname}`
          : 'Anonymous';

        // Broadcast events outside transaction
        setTimeout(() => {
          if (shouldExtend) {
            broadcastToChannel(auction.channel_id, {
              type: 'auction:extended',
              auctionId: input.auctionId,
              newEndsAt: newEndsAt.toISOString(),
            });
          }

          broadcastToChannel(auction.channel_id, {
            type: 'auction:bid_placed',
            auctionId: input.auctionId,
            bidderUsername,
            amount: input.amount,
            nextMinBid: input.amount + 1,
            newEndsAt: shouldExtend ? newEndsAt.toISOString() : undefined,
          });

          // TODO: Send 'auction:outbid' to previous highest bidder
        }, 0);

        return {
          id: bid.id,
          auctionId: bid.auction_id,
          bidderId: bid.bidder_id,
          bidderUsername,
          amount: parseFloat(bid.amount),
          placedAt: bid.placed_at.toISOString(),
        };
      });
    }),

  /**
   * Buyout an auction immediately
   */
  buyout: protectedProcedure
    .input(z.object({
      auctionId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to buyout an auction',
        });
      }

      return await db.transaction().execute(async (trx) => {
        const auction = await trx
          .selectFrom('auctions')
          .selectAll()
          .where('id', '=', input.auctionId)
          .forUpdate()
          .executeTakeFirst();

        if (!auction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Auction not found',
          });
        }

        if (auction.status !== 'active') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Auction is not active',
          });
        }

        if (!auction.buyout_price) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This auction does not have a buyout price',
          });
        }

        if (auction.seller_id === ctx.user!.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You cannot buyout your own auction',
          });
        }

        const buyoutPrice = parseFloat(auction.buyout_price);

        // Update auction status
        await trx
          .updateTable('auctions')
          .set({ 
            status: 'ended',
            current_bid: auction.buyout_price,
            highest_bidder_id: ctx.user!.id
          })
          .where('id', '=', input.auctionId)
          .execute();

        // Create order
        const paymentDeadline = new Date();
        paymentDeadline.setDate(paymentDeadline.getDate() + 7); // 7 days from now

        const order = await trx
          .insertInto('orders')
          .values({
            id: sql`gen_random_uuid()`,
            auction_id: input.auctionId,
            buyer_id: ctx.user!.id,
            seller_id: auction.seller_id,
            product_id: auction.product_id,
            final_price: buyoutPrice.toFixed(2),
            platform_fee: calculatePlatformFee(buyoutPrice).toFixed(2),
            seller_payout: calculateSellerPayout(buyoutPrice).toFixed(2),
            payment_deadline: paymentDeadline,
            payment_status: 'pending',
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        // Get buyer info
        const buyer = await trx
          .selectFrom('users')
          .select(['firstname', 'lastname'])
          .where('id', '=', ctx.user!.id)
          .executeTakeFirst();

        const buyerUsername = buyer?.firstname && buyer.lastname
          ? `${buyer.firstname} ${buyer.lastname}`
          : 'Anonymous';

        // Get product info
        const product = await trx
          .selectFrom('products')
          .select('name')
          .where('id', '=', auction.product_id)
          .executeTakeFirst();

        // Broadcast events
        setTimeout(() => {
          broadcastToChannel(auction.channel_id, {
            type: 'auction:bought_out',
            auctionId: input.auctionId,
            buyerId: ctx.user!.id,
            buyerUsername,
            buyoutPrice,
          });

          // TODO: Send 'auction:won' to buyer
        }, 0);

        return {
          orderId: order.id,
          auctionId: order.auction_id,
          finalPrice: parseFloat(order.final_price),
          paymentDeadline: order.payment_deadline.toISOString(),
        };
      });
    }),

  /**
   * Get active auction for a channel
   */
  getActive: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const auction = await auctionRepository.findByChannelId(input.channelId, 'active');
      
      if (!auction) {
        return null;
      }

      const auctionWithDetails = await auctionRepository.findWithDetails(auction.id);
      if (!auctionWithDetails) {
        return null;
      }

      return mapAuctionToOutboundDto(auctionWithDetails);
    }),

  /**
   * Get bid history for an auction
   */
  getBidHistory: publicProcedure
    .input(z.object({ auctionId: z.string().uuid() }))
    .query(async ({ input }) => {
      const bids = await bidRepository.findByAuctionIdWithBidders(input.auctionId);
      return bids.map(mapBidToOutboundDto);
    }),

  /**
   * Get auction history for a shop
   */
  getHistory: protectedProcedure
    .input(z.object({ shopId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      // Verify user has shop access
      const hasAccess = await userShopRoleRepository.hasShopAccess(ctx.user.id, input.shopId);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this shop',
        });
      }

      const auctions = await auctionRepository.findByShopId(input.shopId);
      
      // Get details for each auction
      const auctionsWithDetails = await Promise.all(
        auctions.map(async (auction) => {
          const details = await auctionRepository.findWithDetails(auction.id);
          return details ? mapAuctionToOutboundDto(details) : null;
        })
      );

      return auctionsWithDetails.filter((a) => a !== null);
    }),
});

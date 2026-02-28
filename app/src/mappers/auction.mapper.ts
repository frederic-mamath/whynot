import { Auction } from '../db/types';
import { AuctionOutboundDto } from '../types/dto/auction.dto';

export function mapAuctionToOutboundDto(
  auction: Auction & {
    product_name: string;
    product_image_url: string | null;
    seller_firstname: string | null;
    seller_lastname: string | null;
    bidder_firstname: string | null;
    bidder_lastname: string | null;
  }
): AuctionOutboundDto {
  const sellerUsername = auction.seller_firstname && auction.seller_lastname
    ? `${auction.seller_firstname} ${auction.seller_lastname}`
    : 'Unknown Seller';

  const bidderUsername = auction.bidder_firstname && auction.bidder_lastname
    ? `${auction.bidder_firstname} ${auction.bidder_lastname}`
    : null;

  return {
    id: auction.id,
    productId: auction.product_id,
    productName: auction.product_name,
    productImageUrl: auction.product_image_url,
    sellerId: auction.seller_id,
    sellerUsername,
    channelId: auction.channel_id,
    startingPrice: parseFloat(auction.starting_price),
    buyoutPrice: auction.buyout_price ? parseFloat(auction.buyout_price) : null,
    currentBid: parseFloat(auction.current_bid),
    highestBidderId: auction.highest_bidder_id,
    highestBidderUsername: bidderUsername,
    durationSeconds: auction.duration_seconds,
    startedAt: auction.started_at.toISOString(),
    endsAt: auction.ends_at.toISOString(),
    extendedCount: auction.extended_count,
    status: auction.status,
    createdAt: auction.created_at.toISOString(),
  };
}

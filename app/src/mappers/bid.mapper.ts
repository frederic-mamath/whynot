import { Bid } from '../db/types';
import { BidOutboundDto } from '../types/dto/bid.dto';

export function mapBidToOutboundDto(
  bid: {
    id: string;
    auction_id: string;
    bidder_id: number;
    amount: string;
    placed_at: Date;
    created_at: Date;
    bidder_firstname: string | null;
    bidder_lastname: string | null;
  }
): BidOutboundDto {
  const bidderUsername = bid.bidder_firstname && bid.bidder_lastname
    ? `${bid.bidder_firstname} ${bid.bidder_lastname}`
    : 'Anonymous';

  return {
    id: bid.id,
    auctionId: bid.auction_id,
    bidderId: bid.bidder_id,
    bidderUsername,
    amount: parseFloat(bid.amount),
    placedAt: bid.placed_at.toISOString(),
  };
}

export interface BidOutboundDto {
  id: string;
  auctionId: string;
  bidderId: number;
  bidderUsername: string;
  amount: number;
  placedAt: string;
}

export interface PlaceBidInboundDto {
  auctionId: string;
  amount: number;
}

export interface AuctionOutboundDto {
  id: string;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  sellerId: number;
  sellerUsername: string;
  channelId: number;
  startingPrice: number;
  buyoutPrice: number | null;
  currentBid: number;
  highestBidderId: number | null;
  highestBidderUsername: string | null;
  durationSeconds: number;
  startedAt: string;
  endsAt: string;
  extendedCount: number;
  status: 'active' | 'ended' | 'completed' | 'paid' | 'cancelled';
  createdAt: string;
}

export interface CreateAuctionInboundDto {
  productId: number;
  durationSeconds: 60 | 300 | 600 | 1800;
  buyoutPrice?: number;
}

export interface OrderOutboundDto {
  id: string;
  auctionId: string;
  buyerId: number;
  sellerId: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  sellerUsername: string;
  finalPrice: number;
  platformFee: number;
  sellerPayout: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDeadline: string;
  paidAt: string | null;
  shippedAt: string | null;
  createdAt: string;
}

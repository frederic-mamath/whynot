import { Order } from '../db/types';
import { OrderOutboundDto } from '../types/dto/order.dto';

export function mapOrderToOutboundDto(
  order: Order & {
    product_name: string;
    product_image_url: string | null;
    seller_firstname: string | null;
    seller_lastname: string | null;
  }
): OrderOutboundDto {
  const sellerUsername = order.seller_firstname && order.seller_lastname
    ? `${order.seller_firstname} ${order.seller_lastname}`
    : 'Unknown Seller';

  return {
    id: order.id,
    auctionId: order.auction_id,
    buyerId: order.buyer_id,
    sellerId: order.seller_id,
    productId: order.product_id,
    productName: order.product_name,
    productImageUrl: order.product_image_url,
    sellerUsername,
    finalPrice: parseFloat(order.final_price),
    platformFee: parseFloat(order.platform_fee),
    sellerPayout: parseFloat(order.seller_payout),
    paymentStatus: order.payment_status,
    paymentDeadline: order.payment_deadline.toISOString(),
    paidAt: order.paid_at?.toISOString() ?? null,
    shippedAt: order.shipped_at?.toISOString() ?? null,
    createdAt: order.created_at.toISOString(),
  };
}

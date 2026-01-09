import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { OrderRepository } from '../repositories/OrderRepository';

const orderRepository = new OrderRepository();

export const orderRouter = router({
  /**
   * Get buyer's orders (My Orders page)
   */
  getMyOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      const orders = await orderRepository.findByBuyerId(
        ctx.user.id,
        input?.status
      );

      return orders.map((order: any) => {
        // Determine display status based on payment_status and shipped_at
        let displayStatus: 'pending' | 'paid' | 'shipped' | 'failed' | 'refunded' = order.payment_status;
        if (order.payment_status === 'paid' && order.shipped_at) {
          displayStatus = 'shipped';
        }

        return {
          id: order.id,
          auctionId: order.auction_id,
          productId: order.product_id,
          productName: order.product_name,
          productImageUrl: order.product_image_url,
          sellerId: order.seller_id,
          sellerUsername: order.seller_email.split('@')[0], // Extract username from email
          finalPrice: parseFloat(order.final_price),
          platformFee: parseFloat(order.platform_fee),
          sellerPayout: parseFloat(order.seller_payout),
          paymentStatus: displayStatus,
          paymentDeadline: order.payment_deadline.toISOString(),
          paidAt: order.paid_at?.toISOString() || null,
          shippedAt: order.shipped_at?.toISOString() || null,
          createdAt: order.created_at.toISOString(),
        };
      });
    }),

  /**
   * Get seller's pending deliveries
   * TODO: Implement in Phase 8
   */
  getPendingDeliveries: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      // TODO: Implement in Phase 8
      return [];
    }),

  /**
   * Create Stripe payment intent for order
   * TODO: Implement in Phase 8 with Stripe integration
   */
  createPaymentIntent: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Payment integration will be implemented in Phase 8',
      });
    }),

  /**
   * Mark order as shipped (seller only)
   * TODO: Implement in Phase 8
   */
  markAsShipped: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Order fulfillment will be implemented in Phase 8',
      });
    }),
});

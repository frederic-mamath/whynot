import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { OrderRepository } from '../repositories/OrderRepository';
import { stripeService } from '../services/StripeService';
import { db } from '../db';

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
   */
  getPendingDeliveries: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      const orders = await orderRepository.findPendingDeliveriesBySellerId(ctx.user.id);

      return orders.map((order: any) => ({
        id: order.id,
        productName: order.product_name,
        productImageUrl: order.product_image_url,
        buyerUsername: order.buyer_username,
        finalPrice: parseFloat(order.final_price),
        paidAt: order.paid_at.toISOString(),
        createdAt: order.created_at.toISOString(),
      }));
    }),

  /**
   * Create Stripe payment intent for order
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

      const { orderId } = input;

      // Get order
      const order = await db
        .selectFrom('orders')
        .select([
          'id',
          'buyer_id',
          'final_price',
          'payment_status',
          'stripe_payment_intent_id',
        ])
        .where('id', '=', orderId)
        .executeTakeFirst();

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      if (order.buyer_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not your order',
        });
      }

      if (order.payment_status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order already paid or failed',
        });
      }

      // Return existing payment intent if available
      if (order.stripe_payment_intent_id) {
        const existing = await stripeService.getPaymentIntent(
          order.stripe_payment_intent_id
        );
        return { clientSecret: existing.client_secret };
      }

      // Create new payment intent
      const amountInCents = Math.round(parseFloat(order.final_price) * 100);
      const paymentIntent = await stripeService.createPaymentIntent({
        amount: amountInCents,
        orderId: order.id,
        buyerEmail: ctx.user.email,
      });

      // Save payment intent ID
      await db
        .updateTable('orders')
        .set({ stripe_payment_intent_id: paymentIntent.id })
        .where('id', '=', order.id)
        .execute();

      return { clientSecret: paymentIntent.client_secret };
    }),

  /**
   * Mark order as shipped (seller only)
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

      const { orderId } = input;

      // Get order and verify seller
      const order = await orderRepository.findById(orderId);

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      if (order.seller_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the seller can mark order as shipped',
        });
      }

      if (order.payment_status !== 'paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order must be paid before shipping',
        });
      }

      if (order.shipped_at) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order already shipped',
        });
      }

      // Mark as shipped
      const updated = await orderRepository.markAsShipped(orderId);

      return {
        id: updated.id,
        shippedAt: updated.shipped_at?.toISOString(),
      };
    }),
});

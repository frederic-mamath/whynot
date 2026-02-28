import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { PayoutRequestRepository } from '../repositories/PayoutRequestRepository';
import { db } from '../db';

const payoutRequestRepository = new PayoutRequestRepository();

export const payoutRouter = router({
  /**
   * Seller: Create payout request
   */
  createRequest: protectedProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        paymentMethod: z.string().min(1),
        paymentDetails: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      const { orderId, paymentMethod, paymentDetails } = input;

      // Get order with details
      const order = await db
        .selectFrom('orders')
        .select([
          'id',
          'seller_id',
          'seller_payout',
          'payment_status',
          'shipped_at',
        ])
        .where('id', '=', orderId)
        .executeTakeFirst();

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      if (order.seller_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not your order',
        });
      }

      if (order.payment_status !== 'paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order must be paid before requesting payout',
        });
      }

      if (!order.shipped_at) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order must be shipped before requesting payout',
        });
      }

      // Check if payout request already exists
      const existing = await payoutRequestRepository.findByOrderId(orderId);
      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payout request already exists for this order',
        });
      }

      // Create payout request
      const payoutRequest = await payoutRequestRepository.create({
        seller_id: ctx.user.id,
        order_id: orderId,
        amount: order.seller_payout,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
      });

      return {
        id: payoutRequest.id,
        amount: parseFloat(payoutRequest.amount),
        status: payoutRequest.status,
        createdAt: payoutRequest.created_at.toISOString(),
      };
    }),

  /**
   * Seller: Get my payout requests
   */
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    const requests = await payoutRequestRepository.findBySellerId(ctx.user.id);

    return requests.map((req) => ({
      id: req.id,
      orderId: req.order_id,
      amount: parseFloat(req.amount),
      status: req.status,
      paymentMethod: req.payment_method,
      paymentDetails: req.payment_details,
      processedAt: req.processed_at?.toISOString() || null,
      rejectionReason: req.rejection_reason,
      createdAt: req.created_at.toISOString(),
    }));
  }),

  /**
   * Admin: Get all pending payout requests
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in',
      });
    }

    // Check if user is admin
    const userRoles = await db
      .selectFrom('user_roles')
      .innerJoin('roles', 'roles.id', 'user_roles.role_id')
      .select(['roles.name'])
      .where('user_roles.user_id', '=', ctx.user.id)
      .execute();

    const isAdmin = userRoles.some((r) => r.name === 'admin');
    if (!isAdmin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }

    const requests = await payoutRequestRepository.findByStatus('pending');

    return requests.map((req) => ({
      id: req.id,
      orderId: req.order_id,
      sellerId: req.seller_id,
      sellerName: `${req.seller_firstname || ''} ${req.seller_lastname || ''}`.trim() || req.seller_email,
      sellerEmail: req.seller_email,
      productName: req.product_name,
      productImageUrl: req.product_image_url,
      amount: parseFloat(req.amount),
      orderFinalPrice: parseFloat(req.order_final_price),
      status: req.status,
      paymentMethod: req.payment_method,
      paymentDetails: req.payment_details,
      createdAt: req.created_at.toISOString(),
    }));
  }),

  /**
   * Admin: Approve payout request
   */
  approveRequest: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      // Check if user is admin
      const userRoles = await db
        .selectFrom('user_roles')
        .innerJoin('roles', 'roles.id', 'user_roles.role_id')
        .select(['roles.name'])
        .where('user_roles.user_id', '=', ctx.user.id)
        .execute();

      const isAdmin = userRoles.some((r) => r.name === 'admin');
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const updated = await payoutRequestRepository.updateStatus(
        input.requestId,
        'approved',
        ctx.user.id
      );

      return {
        id: updated.id,
        status: updated.status,
        processedAt: updated.processed_at?.toISOString(),
      };
    }),

  /**
   * Admin: Mark payout as paid
   */
  markAsPaid: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      // Check if user is admin
      const userRoles = await db
        .selectFrom('user_roles')
        .innerJoin('roles', 'roles.id', 'user_roles.role_id')
        .select(['roles.name'])
        .where('user_roles.user_id', '=', ctx.user.id)
        .execute();

      const isAdmin = userRoles.some((r) => r.name === 'admin');
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const updated = await payoutRequestRepository.updateStatus(
        input.requestId,
        'paid',
        ctx.user.id
      );

      return {
        id: updated.id,
        status: updated.status,
        processedAt: updated.processed_at?.toISOString(),
      };
    }),

  /**
   * Admin: Reject payout request
   */
  rejectRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().uuid(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in',
        });
      }

      // Check if user is admin
      const userRoles = await db
        .selectFrom('user_roles')
        .innerJoin('roles', 'roles.id', 'user_roles.role_id')
        .select(['roles.name'])
        .where('user_roles.user_id', '=', ctx.user.id)
        .execute();

      const isAdmin = userRoles.some((r) => r.name === 'admin');
      if (!isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin access required',
        });
      }

      const updated = await payoutRequestRepository.updateStatus(
        input.requestId,
        'rejected',
        ctx.user.id,
        input.reason
      );

      return {
        id: updated.id,
        status: updated.status,
        rejectionReason: updated.rejection_reason,
        processedAt: updated.processed_at?.toISOString(),
      };
    }),
});

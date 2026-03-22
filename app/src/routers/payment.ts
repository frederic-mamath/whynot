import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { userRepository } from "../repositories/UserRepository";
import { stripeService } from "../services/StripeService";

export const paymentRouter = router({
  /**
   * Get the current user's payment method status.
   * Returns whether they have a Stripe Customer with at least one saved payment method.
   */
  getPaymentStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await userRepository.findById(ctx.user.id);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // No Stripe Customer yet → no payment method
    if (!user.stripe_customer_id) {
      return { hasPaymentMethod: false, paymentMethods: [] };
    }

    try {
      const methods = await stripeService.listPaymentMethods({
        customerId: user.stripe_customer_id,
      });

      return {
        hasPaymentMethod: methods.length > 0,
        paymentMethods: methods.map((pm) => ({
          id: pm.id,
          type: pm.type, // 'card', 'link', etc.
          card: pm.card
            ? {
                brand: pm.card.brand, // 'visa', 'mastercard', 'amex', …
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
              }
            : null,
          // wallet info (apple_pay / google_pay) is nested in card.wallet
          wallet: pm.card?.wallet?.type ?? null, // 'apple_pay' | 'google_pay' | null
        })),
      };
    } catch {
      // If Stripe call fails, assume no payment so user can re-setup
      return { hasPaymentMethod: false, paymentMethods: [] };
    }
  }),

  /**
   * Create a Stripe SetupIntent to collect a payment method (card, Apple Pay, Google Pay).
   * Creates a Stripe Customer first if the user doesn't have one yet.
   * Returns the clientSecret needed by the frontend <PaymentElement>.
   */
  createSetupIntent: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await userRepository.findById(ctx.user.id);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    let customerId = user.stripe_customer_id;

    // Create Stripe Customer if not yet created
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: user.email,
        userId: user.id,
      });
      customerId = customer.id;

      await userRepository.updateStripeCustomerId(user.id, customerId);
    }

    // Create SetupIntent for this customer
    const setupIntent = await stripeService.createSetupIntent({ customerId });

    return { clientSecret: setupIntent.client_secret! };
  }),

  /**
   * Detach (delete) a saved payment method from the current user's Stripe Customer.
   * Verifies ownership before detaching to prevent cross-user attacks.
   */
  deletePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await userRepository.findById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (!user.stripe_customer_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No Stripe customer found for this user",
        });
      }

      // Security: verify the payment method belongs to this user's customer
      const methods = await stripeService.listPaymentMethods({
        customerId: user.stripe_customer_id,
      });
      const owns = methods.some((pm) => pm.id === input.paymentMethodId);
      if (!owns) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment method does not belong to this user",
        });
      }

      await stripeService.detachPaymentMethod(input.paymentMethodId);
      return { success: true };
    }),
});

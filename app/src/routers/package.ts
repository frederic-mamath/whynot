import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { packageRepository, PackageWithDetails } from "../repositories/PackageRepository";
import { mondialRelayService } from "../services/MondialRelayService";
import { db } from "../db";

function mapPackage(pkg: PackageWithDetails) {
  return {
    id: pkg.id,
    status: pkg.status,
    trackingNumber: pkg.tracking_number,
    labelUrl: pkg.label_url,
    weightGrams: pkg.weight_grams,
    deliveredAt: pkg.delivered_at?.toISOString() ?? null,
    createdAt: (pkg.created_at as Date).toISOString(),
    hasBuyerRelayPoint: !!pkg.buyer_mondial_relay_point_id,
    buyerName:
      [pkg.buyer_firstname, pkg.buyer_lastname].filter(Boolean).join(" ") ||
      pkg.buyer_nickname,
    liveName: pkg.live_name,
    liveCoverUrl: pkg.live_cover_url,
    liveStartsAt: (pkg.live_starts_at as Date).toISOString(),
    orders: pkg.orders.map((o) => ({
      id: o.id,
      productName: o.product_name,
      productImageUrl: o.product_image_url,
      finalPrice: parseFloat(o.final_price),
      sellerPayout: parseFloat(o.seller_payout),
      paidAt: o.paid_at?.toISOString() ?? null,
      createdAt: (o.created_at as Date).toISOString(),
    })),
  };
}

export const packageRouter = router({
  /**
   * Get all packages for the logged-in seller, split into pending and shipped.
   */
  getPackagesForSeller: protectedProcedure.query(async ({ ctx }) => {
    const packages = await packageRepository.findBySellerId(ctx.user.id);

    const pending = packages
      .filter((p) => p.status === "pending" || p.status === "label_generated")
      .map(mapPackage);

    const shipped = packages
      .filter(
        (p) =>
          p.status === "shipped" ||
          p.status === "delivered" ||
          p.status === "incident",
      )
      .map(mapPackage);

    return { pending, shipped };
  }),

  /**
   * Generate a Mondial Relay label for a package.
   */
  generateLabel: protectedProcedure
    .input(
      z.object({
        packageId: z.string().uuid(),
        weightGrams: z.number().int().min(1).max(30000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pkg = await packageRepository.findByIdForSeller(
        input.packageId,
        ctx.user.id,
      );
      if (!pkg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }
      if (pkg.status !== "pending" && pkg.status !== "label_generated") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Label can only be generated for pending packages",
        });
      }

      const sellerData = await db
        .selectFrom("seller_onboarding_data")
        .select([
          "return_street",
          "return_city",
          "return_zip_code",
          "return_country",
        ])
        .where("user_id", "=", ctx.user.id)
        .executeTakeFirst();

      if (!sellerData?.return_street) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complétez votre adresse de retour dans les paramètres vendeur",
        });
      }

      const buyer = await db
        .selectFrom("users")
        .select(["firstname", "lastname", "nickname"])
        .where("id", "=", pkg.buyer_id)
        .executeTakeFirstOrThrow();

      const relayAddr = await db
        .selectFrom("user_addresses")
        .select([
          "mondial_relay_point_id",
          "street",
          "city",
          "zip_code",
          "country",
        ])
        .where("user_id", "=", pkg.buyer_id)
        .where("mondial_relay_point_id", "is not", null)
        .executeTakeFirst();

      if (!relayAddr?.mondial_relay_point_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'acheteur n'a pas encore choisi un point relais",
        });
      }

      const seller = await db
        .selectFrom("users")
        .select(["firstname", "lastname", "nickname"])
        .where("id", "=", ctx.user.id)
        .executeTakeFirstOrThrow();

      // Find a collection relay near the seller's zip code
      const sellerRelays = await mondialRelayService.searchRelayPoints(
        sellerData.return_zip_code!,
      );
      if (!sellerRelays.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aucun point relais trouvé près de votre adresse",
        });
      }

      const { trackingNumber, labelUrl } = await mondialRelayService.createLabel({
        packageId: pkg.id,
        weightGrams: input.weightGrams,
        deliveryRelayId: relayAddr.mondial_relay_point_id,
        collectionRelayId: sellerRelays[0].id,
        seller: {
          name:
            [seller.firstname, seller.lastname].filter(Boolean).join(" ") ||
            seller.nickname,
          street: sellerData.return_street,
          city: sellerData.return_city!,
          zipCode: sellerData.return_zip_code!,
          country: sellerData.return_country || "FR",
        },
        buyer: {
          firstname: buyer.firstname || buyer.nickname,
          lastname: buyer.lastname || "",
          city: relayAddr.city,
          zipCode: relayAddr.zip_code,
          country: relayAddr.country,
        },
      });

      await packageRepository.updateLabel(
        pkg.id,
        trackingNumber,
        labelUrl,
        input.weightGrams,
        relayAddr.mondial_relay_point_id,
      );

      await db
        .updateTable("orders")
        .set({ shipped_at: new Date() })
        .where("package_id", "=", pkg.id)
        .execute();

      return { trackingNumber, labelUrl };
    }),

  /**
   * Refresh tracking status from Mondial Relay.
   */
  refreshStatus: protectedProcedure
    .input(z.object({ packageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pkg = await packageRepository.findByIdForSeller(
        input.packageId,
        ctx.user.id,
      );
      if (!pkg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }
      if (!pkg.tracking_number) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ce colis n'a pas encore de numéro de suivi",
        });
      }

      const tracking = await mondialRelayService.getTracking(
        pkg.tracking_number,
      );

      await packageRepository.updateStatus(
        pkg.id,
        tracking.status,
        tracking.status === "delivered"
          ? (tracking.lastEventAt ?? new Date())
          : undefined,
      );

      return { status: tracking.status, lastEvent: tracking.lastEvent };
    }),

  /**
   * Request payout for all orders in a shipped package.
   */
  requestPayouts: protectedProcedure
    .input(z.object({ packageId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const pkg = await packageRepository.findByIdForSeller(
        input.packageId,
        ctx.user.id,
      );
      if (!pkg) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }
      if (pkg.status !== "shipped" && pkg.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Le colis doit être expédié avant de demander le paiement",
        });
      }

      const orders = await db
        .selectFrom("orders")
        .leftJoin("payout_requests", "payout_requests.order_id", "orders.id")
        .select(["orders.id", "orders.seller_payout"])
        .where("orders.package_id", "=", pkg.id)
        .where("orders.payment_status", "=", "paid")
        .where("payout_requests.id", "is", null)
        .execute();

      await Promise.all(
        orders.map((order) =>
          db
            .insertInto("payout_requests")
            .values({
              seller_id: ctx.user.id,
              order_id: order.id,
              amount: order.seller_payout,
              status: "pending",
            })
            .execute(),
        ),
      );

      return { createdCount: orders.length };
    }),
});

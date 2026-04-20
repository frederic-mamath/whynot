import { db } from "../db";
import { sql } from "kysely";
import { auctionRepository } from "../repositories";
import { broadcastToChannel } from "../websocket/broadcast";
import { liveEvents } from "../routers/live";
import { calculatePlatformFee, calculateSellerPayout } from "../utils/fees";

/**
 * Close an auction and handle all side effects
 * Used by both API mutation and background processor
 */
export async function closeAuction(auctionId: string): Promise<{
  auctionId: string;
  status: string;
  winnerId: number | null;
  winnerUsername: string | null;
  finalPrice: number | null;
  orderId: string | null;
}> {
  // 1. Get auction
  const auction = await auctionRepository.findById(auctionId);

  if (!auction) {
    throw new Error(`Auction ${auctionId} not found`);
  }

  // 2. If already closed, return early (idempotent)
  if (auction.status !== "active") {
    console.log(
      `[closeAuction] Auction ${auctionId} already ${auction.status}`,
    );
    return {
      auctionId,
      status: auction.status,
      winnerId: auction.highest_bidder_id,
      winnerUsername: null,
      finalPrice: parseFloat(auction.current_bid),
      orderId: null,
    };
  }

  // 3. Close auction in transaction
  return db.transaction().execute(async (trx) => {
    // Mark auction as completed
    await trx
      .updateTable("auctions")
      .set({ status: "completed" })
      .where("id", "=", auctionId)
      .execute();

    let orderId = null;
    let winnerUsername = null;

    // Create order if there's a winner
    if (auction.highest_bidder_id) {
      const finalPrice = parseFloat(auction.current_bid);
      const platformFee = calculatePlatformFee(finalPrice);
      const sellerPayout = calculateSellerPayout(finalPrice);
      const paymentDeadline = new Date();
      paymentDeadline.setDate(paymentDeadline.getDate() + 7); // +7 days

      const order = await trx
        .insertInto("orders")
        .values({
          id: sql`gen_random_uuid()`,
          auction_id: auctionId,
          buyer_id: auction.highest_bidder_id,
          seller_id: auction.seller_id,
          product_id: auction.product_id,
          final_price: finalPrice.toFixed(2),
          platform_fee: platformFee.toFixed(2),
          seller_payout: sellerPayout.toFixed(2),
          payment_status: "pending",
          payment_deadline: paymentDeadline,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      orderId = order.id;

      // Get winner info
      const winner = await trx
        .selectFrom("users")
        .select(["nickname"])
        .where("id", "=", auction.highest_bidder_id)
        .executeTakeFirst();

      winnerUsername = winner?.nickname ?? "Anonymous";
    }

    // Clear highlighted product from channel
    await trx
      .updateTable("lives")
      .set({ highlighted_product_id: null, highlighted_at: null })
      .where("id", "=", auction.channel_id)
      .execute();

    // Broadcast events (outside transaction to avoid locks)
    setTimeout(() => {
      const auctionEndedMsg = {
        type: "auction:ended" as const,
        auctionId,
        winnerId: auction.highest_bidder_id,
        winnerUsername,
        finalPrice: parseFloat(auction.current_bid),
        hasWinner: !!auction.highest_bidder_id,
      };
      broadcastToChannel(auction.channel_id, auctionEndedMsg);
      const listenerCount = liveEvents.listenerCount(`channel:${auction.channel_id}:events`);
      console.log(`[auctionService] liveEvents.emit auction:ended → channel ${auction.channel_id} (${listenerCount} listeners)`);
      liveEvents.emit(`channel:${auction.channel_id}:events`, auctionEndedMsg);

      const unhighlightMsg = {
        type: "PRODUCT_UNHIGHLIGHTED" as const,
        channelId: auction.channel_id,
      };
      broadcastToChannel(auction.channel_id, unhighlightMsg);
      liveEvents.emit(`channel:${auction.channel_id}:events`, unhighlightMsg);
    }, 0);

    console.log(
      `[closeAuction] Closed auction ${auctionId}, winner: ${winnerUsername || "none"}, final price: $${auction.current_bid}`,
    );

    return {
      auctionId,
      status: "completed",
      winnerId: auction.highest_bidder_id,
      winnerUsername,
      finalPrice: parseFloat(auction.current_bid),
      orderId,
    };
  });
}

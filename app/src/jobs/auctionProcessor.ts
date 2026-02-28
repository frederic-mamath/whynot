import { db } from '../db';
import { closeAuction } from '../services/auctionService';

let processorInterval: NodeJS.Timeout | null = null;

/**
 * Process all auctions that have ended but are still marked as active
 */
export async function processEndedAuctions(): Promise<void> {
  try {
    // Find auctions that should be closed
    const endedAuctions = await db
      .selectFrom('auctions')
      .select(['id', 'ends_at', 'product_id'])
      .where('status', '=', 'active')
      .where('ends_at', '<=', new Date())
      .execute();

    if (endedAuctions.length === 0) {
      return;
    }

    console.log(`[AuctionProcessor] Found ${endedAuctions.length} ended auction(s) to process`);

    // Process each auction
    for (const auction of endedAuctions) {
      try {
        await closeAuction(auction.id);
        console.log(`[AuctionProcessor] ✅ Closed auction ${auction.id}`);
      } catch (error) {
        console.error(`[AuctionProcessor] ❌ Failed to close auction ${auction.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[AuctionProcessor] Error processing auctions:', error);
  }
}

/**
 * Start the background processor
 * Runs every 30 seconds
 */
export function startAuctionProcessor(): void {
  if (processorInterval) {
    console.warn('[AuctionProcessor] Already running, skipping start');
    return;
  }

  console.log('[AuctionProcessor] Starting background processor (30s interval)');

  // Run immediately on start
  processEndedAuctions();

  // Then run every 30 seconds
  processorInterval = setInterval(() => {
    processEndedAuctions();
  }, 30000); // 30 seconds
}

/**
 * Stop the background processor
 * Call this on server shutdown
 */
export function stopAuctionProcessor(): void {
  if (processorInterval) {
    console.log('[AuctionProcessor] Stopping background processor');
    clearInterval(processorInterval);
    processorInterval = null;
  }
}

import { db } from "../db";

export class LiveProductInterestRepository {
  async toggle(
    buyerId: number,
    productId: number,
    liveId: number,
  ): Promise<{ isInterested: boolean; count: number }> {
    const existing = await db
      .selectFrom("live_product_interests")
      .select("id")
      .where("buyer_id", "=", buyerId)
      .where("product_id", "=", productId)
      .where("live_id", "=", liveId)
      .executeTakeFirst();

    if (existing) {
      await db
        .deleteFrom("live_product_interests")
        .where("id", "=", existing.id)
        .execute();
    } else {
      await db
        .insertInto("live_product_interests")
        .values({ buyer_id: buyerId, product_id: productId, live_id: liveId })
        .execute();
    }

    const count = await this.countByProductAndLive(productId, liveId);
    return { isInterested: !existing, count };
  }

  async countByProductAndLive(
    productId: number,
    liveId: number,
  ): Promise<number> {
    const result = await db
      .selectFrom("live_product_interests")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("product_id", "=", productId)
      .where("live_id", "=", liveId)
      .executeTakeFirstOrThrow();

    return parseInt(result.count, 10);
  }

  async findInterestedProductIds(
    buyerId: number,
    liveId: number,
  ): Promise<number[]> {
    const rows = await db
      .selectFrom("live_product_interests")
      .select("product_id")
      .where("buyer_id", "=", buyerId)
      .where("live_id", "=", liveId)
      .execute();

    return rows.map((r) => r.product_id);
  }
}

export const liveProductInterestRepository =
  new LiveProductInterestRepository();

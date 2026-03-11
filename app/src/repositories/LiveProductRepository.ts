import { db } from "../db";
import { Selectable } from "kysely";
import { LiveProductsTable } from "../db/types";

type LiveProduct = Selectable<LiveProductsTable>;

export class LiveProductRepository {
  async associate(liveId: number, productId: number): Promise<LiveProduct> {
    return db
      .insertInto("live_products")
      .values({
        live_id: liveId,
        product_id: productId,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async remove(liveId: number, productId: number): Promise<boolean> {
    const result = await db
      .deleteFrom("live_products")
      .where("live_id", "=", liveId)
      .where("product_id", "=", productId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  async isAssociated(liveId: number, productId: number): Promise<boolean> {
    const result = await db
      .selectFrom("live_products")
      .select(["id"])
      .where("live_id", "=", liveId)
      .where("product_id", "=", productId)
      .executeTakeFirst();
    return result !== undefined;
  }

  async findByLiveId(liveId: number): Promise<LiveProduct[]> {
    return db
      .selectFrom("live_products")
      .selectAll()
      .where("live_id", "=", liveId)
      .execute();
  }

  /** @deprecated use findByLiveId() */
  async findByChannelId(liveId: number): Promise<LiveProduct[]> {
    return this.findByLiveId(liveId);
  }

  async findByProductId(productId: number): Promise<LiveProduct[]> {
    return db
      .selectFrom("live_products")
      .selectAll()
      .where("product_id", "=", productId)
      .execute();
  }

  async removeAllByLive(liveId: number): Promise<number> {
    const result = await db
      .deleteFrom("live_products")
      .where("live_id", "=", liveId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** @deprecated use removeAllByLive() */
  async removeAllByChannel(liveId: number): Promise<number> {
    return this.removeAllByLive(liveId);
  }

  async removeAllByProduct(productId: number): Promise<number> {
    const result = await db
      .deleteFrom("live_products")
      .where("product_id", "=", productId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }
}

export const liveProductRepository = new LiveProductRepository();
// Backward compat alias
export const channelProductRepository = liveProductRepository;

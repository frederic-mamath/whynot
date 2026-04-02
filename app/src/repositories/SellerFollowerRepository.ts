import { db } from "../db";

class SellerFollowerRepository {
  async follow(followerId: number, sellerId: number): Promise<void> {
    await db
      .insertInto("seller_followers")
      .values({ follower_id: followerId, seller_id: sellerId })
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  async unfollow(followerId: number, sellerId: number): Promise<void> {
    await db
      .deleteFrom("seller_followers")
      .where("follower_id", "=", followerId)
      .where("seller_id", "=", sellerId)
      .execute();
  }

  async findFollowerEmails(sellerId: number): Promise<string[]> {
    const rows = await db
      .selectFrom("seller_followers")
      .innerJoin("users", "users.id", "seller_followers.follower_id")
      .select("users.email")
      .where("seller_followers.seller_id", "=", sellerId)
      .execute();
    return rows.map((r) => r.email);
  }
}

export const sellerFollowerRepository = new SellerFollowerRepository();

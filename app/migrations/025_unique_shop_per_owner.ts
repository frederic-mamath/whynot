import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Step 1: Find owners with multiple shops and keep only the first one
  const duplicateOwners = await sql<{ owner_id: number }>`
    SELECT owner_id FROM shops GROUP BY owner_id HAVING COUNT(*) > 1
  `.execute(db);

  for (const { owner_id } of duplicateOwners.rows) {
    // Get all shops for this owner, ordered by creation date
    const shops = await db
      .selectFrom("shops")
      .select(["id"])
      .where("owner_id", "=", owner_id)
      .orderBy("created_at", "asc")
      .execute();

    const keepShopId = shops[0].id;
    const removeShopIds = shops.slice(1).map((s) => s.id);

    // Reassign products from duplicate shops to the kept shop
    for (const removeId of removeShopIds) {
      await db
        .updateTable("products")
        .set({ shop_id: keepShopId })
        .where("shop_id", "=", removeId)
        .execute();

      // Reassign user_shop_roles (except owner role which will be recreated)
      await db
        .deleteFrom("user_shop_roles")
        .where("shop_id", "=", removeId)
        .execute();

      // Delete the duplicate shop
      await db.deleteFrom("shops").where("id", "=", removeId).execute();
    }
  }

  // Step 2: Add unique constraint on owner_id
  await db.schema
    .alterTable("shops")
    .addUniqueConstraint("shops_owner_id_unique", ["owner_id"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("shops")
    .dropConstraint("shops_owner_id_unique")
    .execute();
}

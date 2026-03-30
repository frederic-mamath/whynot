import { db } from "../db";
import { Package, PackagesTable } from "../db/types";
import { Selectable } from "kysely";
import { sql } from "kysely";

export type PackageStatus =
  | "pending"
  | "label_generated"
  | "shipped"
  | "delivered"
  | "incident";

export interface OrderInPackage {
  id: string;
  final_price: string;
  seller_payout: string;
  paid_at: Date | null;
  created_at: Date;
  product_name: string;
  product_image_url: string | null;
}

export interface PackageWithDetails extends Selectable<PackagesTable> {
  buyer_firstname: string | null;
  buyer_lastname: string | null;
  buyer_nickname: string;
  live_name: string;
  live_cover_url: string | null;
  live_starts_at: Date;
  relay_street: string | null;
  relay_city: string | null;
  relay_zip_code: string | null;
  relay_country: string | null;
  buyer_mondial_relay_point_id: string | null;
  orders: OrderInPackage[];
}

export class PackageRepository {
  async findBySellerId(sellerId: number): Promise<PackageWithDetails[]> {
    const packages = await db
      .selectFrom("packages")
      .innerJoin("users as buyer", "buyer.id", "packages.buyer_id")
      .innerJoin("lives", "lives.id", "packages.live_id")
      .leftJoin("user_addresses as relay_addr", (join) =>
        join
          .onRef("relay_addr.user_id", "=", "packages.buyer_id")
          .on("relay_addr.mondial_relay_point_id", "is not", null),
      )
      .select([
        "packages.id",
        "packages.buyer_id",
        "packages.seller_id",
        "packages.live_id",
        "packages.tracking_number",
        "packages.label_url",
        "packages.weight_grams",
        "packages.mondial_relay_point_id",
        "packages.status",
        "packages.delivered_at",
        "packages.created_at",
        "packages.updated_at",
        "buyer.firstname as buyer_firstname",
        "buyer.lastname as buyer_lastname",
        "buyer.nickname as buyer_nickname",
        "lives.name as live_name",
        "lives.cover_url as live_cover_url",
        "lives.starts_at as live_starts_at",
        "relay_addr.street as relay_street",
        "relay_addr.city as relay_city",
        "relay_addr.zip_code as relay_zip_code",
        "relay_addr.country as relay_country",
        "relay_addr.mondial_relay_point_id as buyer_mondial_relay_point_id",
      ])
      .where("packages.seller_id", "=", sellerId)
      .orderBy("packages.created_at", "desc")
      .execute();

    if (packages.length === 0) return [];

    const packageIds = packages.map((p) => p.id);

    const orders = await db
      .selectFrom("orders")
      .innerJoin("products", "products.id", "orders.product_id")
      .select([
        "orders.id",
        "orders.package_id",
        "orders.final_price",
        "orders.seller_payout",
        "orders.paid_at",
        "orders.created_at",
        "products.name as product_name",
        "products.image_url as product_image_url",
      ])
      .where("orders.package_id", "in", packageIds)
      .execute();

    const ordersByPackage = new Map<string, OrderInPackage[]>();
    for (const order of orders) {
      if (!order.package_id) continue;
      const existing = ordersByPackage.get(order.package_id) ?? [];
      existing.push({
        id: order.id,
        final_price: order.final_price,
        seller_payout: order.seller_payout,
        paid_at: order.paid_at,
        created_at: order.created_at,
        product_name: order.product_name,
        product_image_url: order.product_image_url,
      });
      ordersByPackage.set(order.package_id, existing);
    }

    return packages.map((p) => ({
      ...p,
      orders: ordersByPackage.get(p.id) ?? [],
    })) as PackageWithDetails[];
  }

  async findOrCreate(
    buyerId: number,
    sellerId: number,
    liveId: number,
  ): Promise<string> {
    const inserted = await db
      .insertInto("packages")
      .values({
        buyer_id: buyerId,
        seller_id: sellerId,
        live_id: liveId,
        status: "pending",
      })
      .onConflict((oc) =>
        oc.columns(["buyer_id", "seller_id", "live_id"]).doNothing(),
      )
      .returning("id")
      .executeTakeFirst();

    if (inserted) return inserted.id;

    const existing = await db
      .selectFrom("packages")
      .select("id")
      .where("buyer_id", "=", buyerId)
      .where("seller_id", "=", sellerId)
      .where("live_id", "=", liveId)
      .executeTakeFirstOrThrow();

    return existing.id;
  }

  async assignOrderToPackage(
    orderId: string,
    packageId: string,
  ): Promise<void> {
    await db
      .updateTable("orders")
      .set({ package_id: packageId })
      .where("id", "=", orderId)
      .execute();
  }

  async updateLabel(
    id: string,
    trackingNumber: string,
    labelUrl: string,
    weightGrams: number,
    relayPointId: string,
  ): Promise<void> {
    await db
      .updateTable("packages")
      .set({
        tracking_number: trackingNumber,
        label_url: labelUrl,
        weight_grams: weightGrams,
        mondial_relay_point_id: relayPointId,
        status: "label_generated",
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();
  }

  async updateStatus(
    id: string,
    status: PackageStatus,
    deliveredAt?: Date,
  ): Promise<void> {
    await db
      .updateTable("packages")
      .set({
        status,
        ...(deliveredAt ? { delivered_at: deliveredAt } : {}),
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .execute();
  }

  async findByIdForSeller(
    id: string,
    sellerId: number,
  ): Promise<Package | undefined> {
    return db
      .selectFrom("packages")
      .selectAll()
      .where("id", "=", id)
      .where("seller_id", "=", sellerId)
      .executeTakeFirst();
  }
}

export const packageRepository = new PackageRepository();

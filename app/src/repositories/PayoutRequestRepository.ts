import { db } from "../db";
import { sql } from "kysely";

export interface PayoutRequest {
  id: string;
  seller_id: number;
  order_id: string;
  amount: string;
  status: "pending" | "approved" | "paid" | "rejected";
  payment_method: string | null;
  payment_details: string | null;
  processed_at: Date | null;
  processed_by: number | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PayoutRequestWithDetails {
  id: string;
  seller_id: number;
  order_id: string;
  amount: string;
  status: "pending" | "approved" | "paid" | "rejected";
  payment_method: string | null;
  payment_details: string | null;
  processed_at: Date | null;
  processed_by: number | null;
  rejection_reason: string | null;
  created_at: Date;
  seller_firstname: string | null;
  seller_lastname: string | null;
  seller_email: string;
  product_name: string;
  product_image_url: string | null;
  order_final_price: string;
  order_paid_at: Date | null;
}

export class PayoutRequestRepository {
  async create(data: {
    seller_id: number;
    order_id: string;
    amount: string;
    payment_method: string;
    payment_details: string;
  }): Promise<PayoutRequest> {
    return db
      .insertInto("payout_requests")
      .values({
        ...data,
        id: sql`gen_random_uuid()`,
        status: "pending",
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findById(id: string): Promise<PayoutRequest | undefined> {
    return db
      .selectFrom("payout_requests")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async findBySellerId(sellerId: number): Promise<PayoutRequest[]> {
    return db
      .selectFrom("payout_requests")
      .selectAll()
      .where("seller_id", "=", sellerId)
      .orderBy("created_at", "desc")
      .execute();
  }

  async findByStatus(
    status: "pending" | "approved" | "paid" | "rejected",
  ): Promise<PayoutRequestWithDetails[]> {
    return db
      .selectFrom("payout_requests")
      .innerJoin("orders", "orders.id", "payout_requests.order_id")
      .innerJoin("users as seller", "seller.id", "payout_requests.seller_id")
      .innerJoin("products", "products.id", "orders.product_id")
      .select([
        "payout_requests.id",
        "payout_requests.seller_id",
        "payout_requests.order_id",
        "payout_requests.amount",
        "payout_requests.status",
        "payout_requests.payment_method",
        "payout_requests.payment_details",
        "payout_requests.processed_at",
        "payout_requests.processed_by",
        "payout_requests.rejection_reason",
        "payout_requests.created_at",
        sql<string | null>`seller.firstname`.as("seller_firstname"),
        sql<string | null>`seller.lastname`.as("seller_lastname"),
        sql<string>`seller.email`.as("seller_email"),
        sql<string>`products.name`.as("product_name"),
        sql<string | null>`products.image_url`.as("product_image_url"),
        sql<string>`orders.final_price`.as("order_final_price"),
        sql<Date | null>`orders.paid_at`.as("order_paid_at"),
      ])
      .where("payout_requests.status", "=", status)
      .orderBy("payout_requests.created_at", "desc")
      .execute() as Promise<PayoutRequestWithDetails[]>;
  }

  async findByOrderId(orderId: string): Promise<PayoutRequest | undefined> {
    return db
      .selectFrom("payout_requests")
      .selectAll()
      .where("order_id", "=", orderId)
      .executeTakeFirst();
  }

  async findWithDetails(id: string): Promise<PayoutRequestWithDetails | undefined> {
    return db
      .selectFrom("payout_requests")
      .innerJoin("orders", "orders.id", "payout_requests.order_id")
      .innerJoin("users as seller", "seller.id", "payout_requests.seller_id")
      .innerJoin("products", "products.id", "orders.product_id")
      .select([
        "payout_requests.id",
        "payout_requests.seller_id",
        "payout_requests.order_id",
        "payout_requests.amount",
        "payout_requests.status",
        "payout_requests.payment_method",
        "payout_requests.payment_details",
        "payout_requests.processed_at",
        "payout_requests.processed_by",
        "payout_requests.rejection_reason",
        "payout_requests.created_at",
        sql<string | null>`seller.firstname`.as("seller_firstname"),
        sql<string | null>`seller.lastname`.as("seller_lastname"),
        sql<string>`seller.email`.as("seller_email"),
        sql<string>`products.name`.as("product_name"),
        sql<string | null>`products.image_url`.as("product_image_url"),
        sql<string>`orders.final_price`.as("order_final_price"),
        sql<Date | null>`orders.paid_at`.as("order_paid_at"),
      ])
      .where("payout_requests.id", "=", id)
      .executeTakeFirst() as Promise<PayoutRequestWithDetails | undefined>;
  }

  async updateStatus(
    id: string,
    status: "approved" | "paid" | "rejected",
    processedBy: number,
    rejectionReason?: string,
  ): Promise<PayoutRequest> {
    return db
      .updateTable("payout_requests")
      .set({
        status,
        processed_by: processedBy,
        processed_at: new Date(),
        ...(rejectionReason && { rejection_reason: rejectionReason }),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

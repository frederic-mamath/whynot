import { db } from "../db";
import { Order } from "../db/types";
import { sql } from "kysely";

// Type-safe interfaces for joined queries
interface OrderWithProductAndSeller {
  id: string;
  auction_id: string;
  buyer_id: number;
  seller_id: number;
  product_id: number;
  final_price: string;
  platform_fee: string;
  seller_payout: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_deadline: Date;
  stripe_payment_intent_id: string | null;
  paid_at: Date | null;
  shipped_at: Date | null;
  created_at: Date;
  product_name: string;
  product_image_url: string | null;
  seller_email: string;
}

interface PendingDeliveryOrder {
  id: string;
  final_price: string;
  paid_at: Date | null;
  created_at: Date;
  product_name: string;
  product_image_url: string | null;
  buyer_name: string;
}

interface OrderWithDetails {
  id: string;
  auction_id: string;
  buyer_id: number;
  seller_id: number;
  product_id: number;
  final_price: string;
  platform_fee: string;
  seller_payout: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_deadline: Date;
  stripe_payment_intent_id: string | null;
  paid_at: Date | null;
  shipped_at: Date | null;
  created_at: Date;
  product_name: string;
  product_image_url: string | null;
  seller_firstname: string | null;
  seller_lastname: string | null;
}

export class OrderRepository {
  async findById(id: string): Promise<Order | undefined> {
    return db
      .selectFrom("orders")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async findByBuyerId(
    buyerId: number,
    status?: "pending" | "paid" | "failed" | "refunded",
  ): Promise<OrderWithProductAndSeller[]> {
    let query = db
      .selectFrom("orders")
      .innerJoin("products", "products.id", "orders.product_id")
      .innerJoin("users as seller", "seller.id", "orders.seller_id")
      .select([
        "orders.id",
        "orders.auction_id",
        "orders.buyer_id",
        "orders.seller_id",
        "orders.product_id",
        "orders.final_price",
        "orders.platform_fee",
        "orders.seller_payout",
        "orders.payment_status",
        "orders.payment_deadline",
        "orders.stripe_payment_intent_id",
        "orders.paid_at",
        "orders.shipped_at",
        "orders.created_at",
        sql<string>`products.name`.as("product_name"),
        sql<string | null>`products.image_url`.as("product_image_url"),
        sql<string>`seller.email`.as("seller_email"),
      ])
      .where("orders.buyer_id", "=", buyerId);

    if (status) {
      query = query.where("orders.payment_status", "=", status);
    }

    return query.orderBy("orders.created_at", "desc").execute() as Promise<
      OrderWithProductAndSeller[]
    >;
  }

  async findBySellerId(sellerId: number, status?: string): Promise<Order[]> {
    let query = db
      .selectFrom("orders")
      .selectAll()
      .where("seller_id", "=", sellerId);

    if (status) {
      query = query.where("payment_status", "=", status as any);
    }

    return query.orderBy("created_at", "desc").execute();
  }

  async findPendingDeliveriesBySellerId(
    sellerId: number,
  ): Promise<PendingDeliveryOrder[]> {
    return db
      .selectFrom("orders")
      .innerJoin("products", "products.id", "orders.product_id")
      .innerJoin("users as buyer", "buyer.id", "orders.buyer_id")
      .select([
        "orders.id",
        "orders.final_price",
        "orders.paid_at",
        "orders.created_at",
        sql<string>`products.name`.as("product_name"),
        sql<string | null>`products.image_url`.as("product_image_url"),
        sql<string>`CONCAT(buyer.firstname, ' ', buyer.lastname)`.as(
          "buyer_name",
        ),
      ])
      .where("orders.seller_id", "=", sellerId)
      .where("orders.payment_status", "=", "paid")
      .where("orders.shipped_at", "is", null)
      .orderBy("orders.paid_at", "desc")
      .execute() as Promise<PendingDeliveryOrder[]>;
  }

  async findWithDetails(id: string): Promise<OrderWithDetails | undefined> {
    return db
      .selectFrom("orders")
      .innerJoin("products", "products.id", "orders.product_id")
      .innerJoin("users as seller", "seller.id", "orders.seller_id")
      .select([
        "orders.id",
        "orders.auction_id",
        "orders.buyer_id",
        "orders.seller_id",
        "orders.product_id",
        "orders.final_price",
        "orders.platform_fee",
        "orders.seller_payout",
        "orders.payment_status",
        "orders.payment_deadline",
        "orders.stripe_payment_intent_id",
        "orders.paid_at",
        "orders.shipped_at",
        "orders.created_at",
        sql<string>`products.name`.as("product_name"),
        sql<string | null>`products.image_url`.as("product_image_url"),
        sql<string | null>`seller.firstname`.as("seller_firstname"),
        sql<string | null>`seller.lastname`.as("seller_lastname"),
      ])
      .where("orders.id", "=", id)
      .executeTakeFirst() as Promise<OrderWithDetails | undefined>;
  }

  async create(data: {
    auction_id: string;
    buyer_id: number;
    seller_id: number;
    product_id: number;
    final_price: string;
    platform_fee: string;
    seller_payout: string;
    payment_deadline: Date;
  }): Promise<Order> {
    return db
      .insertInto("orders")
      .values({
        ...data,
        id: sql`gen_random_uuid()`,
        payment_status: "pending",
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updatePaymentStatus(
    id: string,
    status: "pending" | "paid" | "failed" | "refunded",
    paidAt?: Date,
  ): Promise<Order> {
    return db
      .updateTable("orders")
      .set({
        payment_status: status,
        ...(paidAt && { paid_at: paidAt }),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async markAsShipped(id: string): Promise<Order> {
    return db
      .updateTable("orders")
      .set({ shipped_at: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateStripePaymentIntent(
    id: string,
    paymentIntentId: string,
  ): Promise<Order> {
    return db
      .updateTable("orders")
      .set({ stripe_payment_intent_id: paymentIntentId })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}

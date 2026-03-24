import { db } from "../db";
import { Waitlist } from "../db/types";

export class WaitlistRepository {
  async save(email: string, role: "buyer" | "seller"): Promise<Waitlist> {
    return db
      .insertInto("waitlist")
      .values({ email, role })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async existsByEmailAndRole(
    email: string,
    role: "buyer" | "seller",
  ): Promise<boolean> {
    const result = await db
      .selectFrom("waitlist")
      .select("id")
      .where("email", "=", email)
      .where("role", "=", role)
      .executeTakeFirst();
    return result !== undefined;
  }
}

export const waitlistRepository = new WaitlistRepository();

import { db } from "../db";
import { Selectable } from "kysely";
import { UsersTable } from "../db/types";

type User = Selectable<UsersTable>;

/**
 * UserRepository - Spring Data JPA style
 * Each method is a named query with explicit SQL using Kysely
 */
export class UserRepository {
  /**
   * Find user by ID
   * Similar to: SELECT * FROM users WHERE id = ?
   */
  async findById(id: number): Promise<User | undefined> {
    return db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  /**
   * Find user by email (for authentication)
   * Similar to: SELECT * FROM users WHERE email = ?
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
  }

  async findByNickname(nickname: string): Promise<User | undefined> {
    return db
      .selectFrom("users")
      .selectAll()
      .where("nickname", "=", nickname)
      .executeTakeFirst();
  }

  /**
   * Create new user
   * Similar to: INSERT INTO users (email, password, ...) VALUES (?, ?, ...)
   */
  async save(
    email: string,
    hashedPassword: string,
    firstName?: string,
    lastName?: string,
    nickname?: string,
    acceptedCguAt?: Date,
  ): Promise<User> {
    return db
      .insertInto("users")
      .values({
        email,
        password: hashedPassword,
        nickname: nickname || email.split("@")[0].toLowerCase(),
        firstname: firstName || null,
        lastname: lastName || null,
        is_verified: false,
        accepted_cgu_at: acceptedCguAt || null,
        stripe_onboarding_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Check if email exists
   * Similar to: SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)
   */
  async existsByEmail(email: string): Promise<boolean> {
    const result = await db
      .selectFrom("users")
      .select(["id"])
      .where("email", "=", email)
      .executeTakeFirst();

    return result !== undefined;
  }

  /**
   * Update user verification status
   * Similar to: UPDATE users SET is_verified = ?, updated_at = NOW() WHERE id = ?
   */
  async updateVerificationStatus(
    userId: number,
    isVerified: boolean,
  ): Promise<User | undefined> {
    return db
      .updateTable("users")
      .set({
        is_verified: isVerified,
        updated_at: new Date(),
      })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Update user profile
   * Similar to: UPDATE users SET firstname = ?, lastname = ?, updated_at = NOW() WHERE id = ?
   */
  async updateProfile(
    userId: number,
    data: {
      firstname?: string | null;
      lastname?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      nickname?: string;
      avatar_url?: string | null;
      has_completed_onboarding?: boolean;
    },
  ): Promise<User | undefined> {
    const updateData: any = {
      updated_at: new Date(),
    };

    // Support both old and new field names
    if (data.firstname !== undefined) updateData.firstname = data.firstname;
    if (data.lastname !== undefined) updateData.lastname = data.lastname;
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.has_completed_onboarding !== undefined)
      updateData.has_completed_onboarding = data.has_completed_onboarding;

    return db
      .updateTable("users")
      .set(updateData)
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Delete user
   * Similar to: DELETE FROM users WHERE id = ?
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom("users")
      .where("id", "=", id)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Find all users
   * Similar to: SELECT * FROM users ORDER BY created_at DESC LIMIT ?
   */
  async findAll(limit?: number): Promise<User[]> {
    let query = db
      .selectFrom("users")
      .selectAll()
      .orderBy("created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    return query.execute();
  }

  /**
   * Count total users
   * Similar to: SELECT COUNT(*) FROM users
   */
  async count(): Promise<number> {
    const result = await db
      .selectFrom("users")
      .select(db.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();

    return Number(result.count);
  }

  /**
   * Update Stripe Customer ID for a buyer
   * Similar to: UPDATE users SET stripe_customer_id = ?, updated_at = NOW() WHERE id = ?
   */
  async updateStripeCustomerId(
    userId: number,
    stripeCustomerId: string,
  ): Promise<User | undefined> {
    return db
      .updateTable("users")
      .set({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date(),
      })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Create user via OAuth (no password)
   */
  async saveOAuthUser(
    email: string,
    firstName?: string | null,
    lastName?: string | null,
  ): Promise<User> {
    return db
      .insertInto("users")
      .values({
        email,
        password: null as any,
        nickname: email.split("@")[0].toLowerCase(),
        firstname: firstName || null,
        lastname: lastName || null,
        first_name: firstName || null,
        last_name: lastName || null,
        is_verified: true,
        has_completed_onboarding: false,
        stripe_onboarding_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: number,
    hashedPassword: string,
  ): Promise<User | undefined> {
    return db
      .updateTable("users")
      .set({
        password: hashedPassword,
        updated_at: new Date(),
      })
      .where("id", "=", userId)
      .returningAll()
      .executeTakeFirst();
  }
}

// Export singleton instance (Spring @Repository bean style)
export const userRepository = new UserRepository();

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

  /**
   * Create new user
   * Similar to: INSERT INTO users (email, password, ...) VALUES (?, ?, ...)
   */
  async save(
    email: string,
    hashedPassword: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    return db
      .insertInto("users")
      .values({
        email,
        password: hashedPassword,
        firstname: firstName || null,
        lastname: lastName || null,
        is_verified: false,
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
}

// Export singleton instance (Spring @Repository bean style)
export const userRepository = new UserRepository();

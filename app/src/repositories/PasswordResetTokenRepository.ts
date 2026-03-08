import { db } from "../db";
import { Selectable } from "kysely";
import { PasswordResetTokensTable } from "../db/types";

type PasswordResetToken = Selectable<PasswordResetTokensTable>;

export class PasswordResetTokenRepository {
  async save(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    return db
      .insertInto("password_reset_tokens")
      .values({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findValidByUserId(userId: number): Promise<PasswordResetToken[]> {
    return db
      .selectFrom("password_reset_tokens")
      .selectAll()
      .where("user_id", "=", userId)
      .where("used_at", "is", null)
      .where("expires_at", ">", new Date())
      .execute();
  }

  async markAsUsed(tokenId: number): Promise<void> {
    await db
      .updateTable("password_reset_tokens")
      .set({ used_at: new Date() })
      .where("id", "=", tokenId)
      .execute();
  }

  async deleteExpiredByUserId(userId: number): Promise<void> {
    await db
      .deleteFrom("password_reset_tokens")
      .where("user_id", "=", userId)
      .where((eb) =>
        eb.or([
          eb("expires_at", "<=", new Date()),
          eb("used_at", "is not", null),
        ]),
      )
      .execute();
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();

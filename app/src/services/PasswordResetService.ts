import crypto from "crypto";
import { hashPassword, verifyPassword } from "../utils/auth";
import { userRepository } from "../repositories";
import { passwordResetTokenRepository } from "../repositories";
import { emailService } from "./EmailService";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export class PasswordResetService {
  async requestReset(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // Silent — no email enumeration

    // Clean up old tokens
    await passwordResetTokenRepository.deleteExpiredByUserId(user.id);

    // Generate a cryptographic random token
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hashPassword(plainToken);

    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
    await passwordResetTokenRepository.save(user.id, tokenHash, expiresAt);

    await emailService.sendPasswordResetEmail(email, plainToken);
  }

  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    // We need to find the matching token by trying all valid tokens
    // Since we hash tokens, we can't do a direct DB lookup
    // We search by non-expired, non-used tokens and compare
    const allTables = await this.findAllValidTokens();

    for (const token of allTables) {
      const isMatch = await verifyPassword(plainToken, token.token_hash);
      if (isMatch) {
        const hashedPassword = await hashPassword(newPassword);
        await userRepository.updatePassword(token.user_id, hashedPassword);
        await passwordResetTokenRepository.markAsUsed(token.id);
        return;
      }
    }

    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  private async findAllValidTokens() {
    // Query all non-expired, non-used tokens
    // Since we can't filter by hash, we get all valid ones and compare
    const { db } = await import("../db");
    return db
      .selectFrom("password_reset_tokens")
      .selectAll()
      .where("used_at", "is", null)
      .where("expires_at", ">", new Date())
      .execute();
  }
}

export const passwordResetService = new PasswordResetService();

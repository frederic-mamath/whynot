import { TRPCError } from "@trpc/server";
import { userRepository, authProviderRepository } from "../repositories";
import { verifyPassword, hashPassword } from "../utils/auth";

export class AccountMergeService {
  /**
   * Merge an OAuth provider into an existing email/password account.
   * The user must prove ownership by providing their current password.
   */
  async mergeOAuthIntoExistingAccount(
    userId: number,
    password: string,
    provider: string,
    providerUserId: string,
    providerEmail: string | null,
    firstName: string | null,
    lastName: string | null,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Verify password ownership
    if (!user.password) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Account has no password to verify",
      });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid password",
      });
    }

    // Check if provider is already linked
    const existing = await authProviderRepository.findByUserIdAndProvider(
      userId,
      provider,
    );
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Provider already linked to this account",
      });
    }

    // Link the OAuth provider
    await authProviderRepository.save(
      userId,
      provider,
      providerUserId,
      providerEmail,
    );

    // Update profile with most recent info (OAuth data wins)
    if (firstName || lastName) {
      await userRepository.updateProfile(userId, {
        firstname: firstName,
        lastname: lastName,
        first_name: firstName,
        last_name: lastName,
      });
    }

    return user;
  }

  /**
   * Merge an email/password into an existing OAuth-only account.
   * The user must prove OAuth ownership by re-authenticating (already done if this is called).
   * Then we add a password to their account.
   */
  async mergeEmailIntoOAuthAccount(userId: number, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Hash and set the password
    const hashed = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, hashed);

    return user;
  }
}

export const accountMergeService = new AccountMergeService();

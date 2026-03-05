import { db } from "../db";
import { Selectable } from "kysely";
import { AuthProvidersTable } from "../db/types";

type AuthProvider = Selectable<AuthProvidersTable>;

export class AuthProviderRepository {
  async findByProviderAndProviderId(
    provider: string,
    providerUserId: string,
  ): Promise<AuthProvider | undefined> {
    return db
      .selectFrom("auth_providers")
      .selectAll()
      .where("provider", "=", provider)
      .where("provider_user_id", "=", providerUserId)
      .executeTakeFirst();
  }

  async findByUserId(userId: number): Promise<AuthProvider[]> {
    return db
      .selectFrom("auth_providers")
      .selectAll()
      .where("user_id", "=", userId)
      .execute();
  }

  async findByUserIdAndProvider(
    userId: number,
    provider: string,
  ): Promise<AuthProvider | undefined> {
    return db
      .selectFrom("auth_providers")
      .selectAll()
      .where("user_id", "=", userId)
      .where("provider", "=", provider)
      .executeTakeFirst();
  }

  async save(
    userId: number,
    provider: string,
    providerUserId: string,
    providerEmail: string | null,
  ): Promise<AuthProvider> {
    return db
      .insertInto("auth_providers")
      .values({
        user_id: userId,
        provider,
        provider_user_id: providerUserId,
        provider_email: providerEmail,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteByUserIdAndProvider(
    userId: number,
    provider: string,
  ): Promise<boolean> {
    const result = await db
      .deleteFrom("auth_providers")
      .where("user_id", "=", userId)
      .where("provider", "=", provider)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}

export const authProviderRepository = new AuthProviderRepository();

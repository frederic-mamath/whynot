import { db } from "../db";
import { UserAddress } from "../db/types";

export class AddressRepository {
  /**
   * Get all addresses for a user
   */
  async findByUserId(userId: number): Promise<UserAddress[]> {
    return await db
      .selectFrom("user_addresses")
      .selectAll()
      .where("user_id", "=", userId)
      .orderBy("is_default", "desc")
      .orderBy("created_at", "desc")
      .execute();
  }

  /**
   * Get a specific address by ID
   */
  async findById(id: number): Promise<UserAddress | undefined> {
    return await db
      .selectFrom("user_addresses")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  /**
   * Get the default address for a user
   */
  async findDefaultByUserId(userId: number): Promise<UserAddress | undefined> {
    return await db
      .selectFrom("user_addresses")
      .selectAll()
      .where("user_id", "=", userId)
      .where("is_default", "=", true)
      .executeTakeFirst();
  }

  /**
   * Create a new address
   * If it's the first address for the user, automatically set it as default
   */
  async create(data: {
    userId: number;
    label: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    isDefault?: boolean;
  }): Promise<UserAddress> {
    // Check if user has any addresses
    const existingAddresses = await this.findByUserId(data.userId);
    const isFirstAddress = existingAddresses.length === 0;

    // If this should be default or is the first address, unset other defaults
    if (data.isDefault || isFirstAddress) {
      await this.unsetDefaultForUser(data.userId);
    }

    const result = await db
      .insertInto("user_addresses")
      .values({
        user_id: data.userId,
        label: data.label,
        street: data.street,
        street2: data.street2 || null,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        country: data.country || "US",
        is_default: data.isDefault || isFirstAddress,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Update an existing address
   */
  async update(
    id: number,
    data: {
      label?: string;
      street?: string;
      street2?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    },
  ): Promise<UserAddress> {
    const updateData: any = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.street !== undefined) updateData.street = data.street;
    if (data.street2 !== undefined) updateData.street2 = data.street2 || null;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zip_code = data.zipCode;
    if (data.country !== undefined) updateData.country = data.country;

    updateData.updated_at = new Date();

    const result = await db
      .updateTable("user_addresses")
      .set(updateData)
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Set an address as default
   * Automatically unsets other default addresses for the user
   */
  async setDefault(id: number): Promise<UserAddress> {
    const address = await this.findById(id);
    if (!address) {
      throw new Error("Address not found");
    }

    // Unset other defaults for this user
    await this.unsetDefaultForUser(address.user_id);

    // Set this address as default
    const result = await db
      .updateTable("user_addresses")
      .set({ is_default: true, updated_at: new Date() })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return result;
  }

  /**
   * Delete an address
   * If deleting the default address, automatically set another as default
   */
  async delete(id: number): Promise<void> {
    const address = await this.findById(id);
    if (!address) {
      throw new Error("Address not found");
    }

    // Delete the address
    await db.deleteFrom("user_addresses").where("id", "=", id).execute();

    // If this was the default, set another as default
    if (address.is_default) {
      const remainingAddresses = await this.findByUserId(address.user_id);
      if (remainingAddresses.length > 0) {
        await this.setDefault(remainingAddresses[0].id);
      }
    }
  }

  /**
   * Unset all default addresses for a user
   */
  private async unsetDefaultForUser(userId: number): Promise<void> {
    await db
      .updateTable("user_addresses")
      .set({ is_default: false })
      .where("user_id", "=", userId)
      .where("is_default", "=", true)
      .execute();
  }

  /**
   * Verify if an address belongs to a user
   */
  async verifyOwnership(addressId: number, userId: number): Promise<boolean> {
    const address = await db
      .selectFrom("user_addresses")
      .select("id")
      .where("id", "=", addressId)
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return !!address;
  }
}

export const addressRepository = new AddressRepository();

import { db } from "../db";
import { Selectable } from "kysely";
import { ProductImagesTable } from "../db/types";

type ProductImage = Selectable<ProductImagesTable>;

/**
 * ProductImageRepository - CRUD for product images
 */
export class ProductImageRepository {
  /**
   * Find all images for a product, ordered by position
   * Similar to: SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC
   */
  async findByProductId(productId: number): Promise<ProductImage[]> {
    return db
      .selectFrom("product_images")
      .selectAll()
      .where("product_id", "=", productId)
      .orderBy("position", "asc")
      .execute();
  }

  /**
   * Find a single image by ID
   * Similar to: SELECT * FROM product_images WHERE id = ?
   */
  async findById(id: number): Promise<ProductImage | undefined> {
    return db
      .selectFrom("product_images")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  /**
   * Add an image to a product
   * Similar to: INSERT INTO product_images (product_id, url, cloudinary_public_id, position) VALUES (?, ?, ?, ?)
   */
  async save(
    productId: number,
    url: string,
    cloudinaryPublicId: string | null,
    position: number,
  ): Promise<ProductImage> {
    return db
      .insertInto("product_images")
      .values({
        product_id: productId,
        url,
        cloudinary_public_id: cloudinaryPublicId,
        position,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Delete an image by ID
   * Similar to: DELETE FROM product_images WHERE id = ?
   */
  async deleteById(id: number): Promise<boolean> {
    const result = await db
      .deleteFrom("product_images")
      .where("id", "=", id)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }

  /**
   * Delete all images for a product
   * Similar to: DELETE FROM product_images WHERE product_id = ?
   */
  async deleteByProductId(productId: number): Promise<void> {
    await db
      .deleteFrom("product_images")
      .where("product_id", "=", productId)
      .execute();
  }

  /**
   * Get the next position for a product's images
   * Similar to: SELECT COALESCE(MAX(position), -1) + 1 FROM product_images WHERE product_id = ?
   */
  async getNextPosition(productId: number): Promise<number> {
    const result = await db
      .selectFrom("product_images")
      .select(db.fn.max("position").as("max_position"))
      .where("product_id", "=", productId)
      .executeTakeFirst();

    return (result?.max_position ?? -1) + 1;
  }

  /**
   * Update an image's position
   * Similar to: UPDATE product_images SET position = ? WHERE id = ?
   */
  async updatePosition(id: number, position: number): Promise<void> {
    await db
      .updateTable("product_images")
      .set({ position })
      .where("id", "=", id)
      .execute();
  }
}

export const productImageRepository = new ProductImageRepository();

import { db } from "../db";
import { Category } from "../db/types";

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    return db
      .selectFrom("categories")
      .selectAll()
      .orderBy("position", "asc")
      .execute();
  }

  async findById(id: number): Promise<Category | undefined> {
    return db
      .selectFrom("categories")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }
}

export const categoryRepository = new CategoryRepository();

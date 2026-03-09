import { db } from "../db";
import { Condition } from "../db/types";

export class ConditionRepository {
  async findAll(): Promise<Condition[]> {
    return db
      .selectFrom("conditions")
      .selectAll()
      .orderBy("position", "asc")
      .execute();
  }

  async findById(id: number): Promise<Condition | undefined> {
    return db
      .selectFrom("conditions")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }
}

export const conditionRepository = new ConditionRepository();

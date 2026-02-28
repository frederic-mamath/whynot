import { db } from '../db';
import { Role } from '../db/types';

export class RoleRepository {
  /**
   * @Query SELECT * FROM roles WHERE name = :name
   */
  async findByName(name: string): Promise<Role | undefined> {
    return await db
      .selectFrom('roles')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
  }

  /**
   * @Query SELECT * FROM roles WHERE id = :id
   */
  async findById(id: number): Promise<Role | undefined> {
    return await db
      .selectFrom('roles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  /**
   * @Query SELECT * FROM roles
   */
  async findAll(): Promise<Role[]> {
    return await db
      .selectFrom('roles')
      .selectAll()
      .execute();
  }
}

export const roleRepository = new RoleRepository();

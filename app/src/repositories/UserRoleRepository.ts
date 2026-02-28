import { db } from '../db';
import { UserRole } from '../db/types';
import { sql } from 'kysely';

export class UserRoleRepository {
  /**
   * @Query SELECT ur.* FROM user_roles ur
   *        JOIN roles r ON ur.role_id = r.id
   *        WHERE ur.user_id = :userId 
   *        AND r.name = :roleName
   *        AND ur.activated_at IS NOT NULL
   */
  async hasActiveRole(userId: number, roleName: string): Promise<boolean> {
    const result = await db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'ur.role_id', 'r.id')
      .select('ur.id')
      .where('ur.user_id', '=', userId)
      .where('r.name', '=', roleName)
      .where('ur.activated_at', 'is not', null)
      .executeTakeFirst();

    return !!result;
  }

  /**
   * @Query SELECT ur.*, r.name as role_name 
   *        FROM user_roles ur
   *        JOIN roles r ON ur.role_id = r.id
   *        WHERE ur.user_id = :userId
   *        AND ur.activated_at IS NOT NULL
   */
  async findActiveRolesByUserId(userId: number): Promise<Array<UserRole & { role_name: string }>> {
    return await db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'ur.role_id', 'r.id')
      .select([
        'ur.id',
        'ur.user_id',
        'ur.role_id',
        'ur.activated_by',
        'ur.activated_at',
        'ur.created_at',
        'r.name as role_name',
      ])
      .where('ur.user_id', '=', userId)
      .where('ur.activated_at', 'is not', null)
      .execute();
  }

  /**
   * @Query SELECT ur.* FROM user_roles ur
   *        JOIN roles r ON ur.role_id = r.id
   *        WHERE ur.user_id = :userId 
   *        AND r.name = :roleName
   */
  async findByUserIdAndRoleName(
    userId: number,
    roleName: string
  ): Promise<UserRole | undefined> {
    return await db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'ur.role_id', 'r.id')
      .selectAll('ur')
      .where('ur.user_id', '=', userId)
      .where('r.name', '=', roleName)
      .executeTakeFirst();
  }

  /**
   * @Query INSERT INTO user_roles (user_id, role_id, activated_by, activated_at)
   *        VALUES (:userId, :roleId, :activatedBy, :activatedAt)
   */
  async createUserRole(data: {
    userId: number;
    roleId: number;
    activatedBy?: number;
    activatedAt?: Date;
  }): Promise<UserRole> {
    return await db
      .insertInto('user_roles')
      .values({
        user_id: data.userId,
        role_id: data.roleId,
        activated_by: data.activatedBy ?? null,
        activated_at: data.activatedAt ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * @Query UPDATE user_roles 
   *        SET activated_by = :activatedBy, activated_at = :activatedAt
   *        WHERE id = :id
   */
  async activateUserRole(id: number, activatedBy: number): Promise<UserRole> {
    return await db
      .updateTable('user_roles')
      .set({
        activated_by: activatedBy,
        activated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * @Query SELECT ur.* FROM user_roles ur
   *        WHERE ur.activated_at IS NULL
   *        ORDER BY ur.created_at DESC
   */
  async findPendingRequests(): Promise<UserRole[]> {
    return await db
      .selectFrom('user_roles')
      .selectAll()
      .where('activated_at', 'is', null)
      .orderBy('created_at', 'desc')
      .execute();
  }
}

export const userRoleRepository = new UserRoleRepository();

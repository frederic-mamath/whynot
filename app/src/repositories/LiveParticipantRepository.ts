import { db } from "../db";
import { Selectable } from "kysely";
import { LiveParticipantsTable } from "../db/types";

type LiveParticipant = Selectable<LiveParticipantsTable>;

export class LiveParticipantRepository {
  async addParticipant(
    liveId: number,
    userId: number,
    role: "host" | "viewer" | "vendor",
  ): Promise<LiveParticipant> {
    return db
      .insertInto("live_participants")
      .values({
        live_id: liveId,
        user_id: userId,
        role,
        joined_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async removeParticipant(liveId: number, userId: number): Promise<boolean> {
    const result = await db
      .updateTable("live_participants")
      .set({ left_at: new Date() })
      .where("live_id", "=", liveId)
      .where("user_id", "=", userId)
      .where("left_at", "is", null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }

  async getActiveParticipants(liveId: number): Promise<LiveParticipant[]> {
    return db
      .selectFrom("live_participants")
      .selectAll()
      .where("live_id", "=", liveId)
      .where("left_at", "is", null)
      .execute();
  }

  async getParticipantRole(
    liveId: number,
    userId: number,
  ): Promise<string | undefined> {
    const participant = await db
      .selectFrom("live_participants")
      .select(["role"])
      .where("live_id", "=", liveId)
      .where("user_id", "=", userId)
      .where("left_at", "is", null)
      .executeTakeFirst();
    return participant?.role;
  }

  async isActiveParticipant(liveId: number, userId: number): Promise<boolean> {
    const participant = await db
      .selectFrom("live_participants")
      .select(["id"])
      .where("live_id", "=", liveId)
      .where("user_id", "=", userId)
      .where("left_at", "is", null)
      .executeTakeFirst();
    return participant !== undefined;
  }

  async hasEverParticipated(liveId: number, userId: number): Promise<boolean> {
    const participant = await db
      .selectFrom("live_participants")
      .select(["id"])
      .where("live_id", "=", liveId)
      .where("user_id", "=", userId)
      .executeTakeFirst();
    return participant !== undefined;
  }

  async removeAllParticipants(liveId: number): Promise<number> {
    const result = await db
      .updateTable("live_participants")
      .set({ left_at: new Date() })
      .where("live_id", "=", liveId)
      .where("left_at", "is", null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  }

  async getActiveParticipantsWithUserInfo(liveId: number) {
    return db
      .selectFrom("live_participants")
      .innerJoin("users", "users.id", "live_participants.user_id")
      .select([
        "live_participants.user_id",
        "live_participants.role",
        "live_participants.joined_at",
        "users.email",
        "users.firstname",
        "users.lastname",
      ])
      .where("live_participants.live_id", "=", liveId)
      .where("live_participants.left_at", "is", null)
      .execute();
  }

  async countActive(liveId: number): Promise<number> {
    const result = await db
      .selectFrom("live_participants")
      .select(db.fn.countAll<number>().as("count"))
      .where("live_id", "=", liveId)
      .where("left_at", "is", null)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }
}

export const liveParticipantRepository = new LiveParticipantRepository();
// Backward compat alias
export const channelParticipantRepository = liveParticipantRepository;

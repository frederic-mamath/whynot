import { db } from "../db";
import { Selectable } from "kysely";
import { LivesTable } from "../db/types";

export type Live = Selectable<LivesTable>;

export class LiveRepository {
  async findById(id: number): Promise<Live | undefined> {
    return db
      .selectFrom("lives")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async findActive(): Promise<Live[]> {
    return db
      .selectFrom("lives")
      .selectAll()
      .where("status", "=", "active")
      .orderBy("created_at", "desc")
      .execute();
  }

  async findByHost(hostId: number): Promise<Live[]> {
    return db
      .selectFrom("lives")
      .selectAll()
      .where("host_id", "=", hostId)
      .orderBy("starts_at", "desc")
      .execute();
  }

  /** Lives scheduled in the future (status = 'scheduled'), ordered ASC */
  async findScheduledByHost(hostId: number): Promise<Live[]> {
    return db
      .selectFrom("lives")
      .selectAll()
      .where("host_id", "=", hostId)
      .where("status", "=", "scheduled")
      .where("starts_at", ">", new Date())
      .orderBy("starts_at", "asc")
      .execute();
  }

  /** Lives in the past (starts_at <= now), ordered DESC */
  async findPastByHost(hostId: number): Promise<Live[]> {
    return db
      .selectFrom("lives")
      .selectAll()
      .where("host_id", "=", hostId)
      .where("starts_at", "<=", new Date())
      .orderBy("starts_at", "desc")
      .execute();
  }

  async save(data: {
    name: string;
    host_id: number;
    max_participants?: number | null;
    is_private?: boolean | null;
    starts_at?: Date;
    ends_at?: Date | null;
    description?: string | null;
  }): Promise<Live> {
    const now = new Date();
    return db
      .insertInto("lives")
      .values({
        name: data.name,
        host_id: data.host_id,
        max_participants: data.max_participants ?? null,
        is_private: data.is_private ?? null,
        starts_at: data.starts_at ?? now,
        ends_at: data.ends_at ?? null,
        description: data.description ?? null,
        status: "active",
        created_at: now,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async update(
    liveId: number,
    data: {
      name?: string;
      description?: string | null;
      startsAt?: Date;
      endsAt?: Date | null;
    },
  ): Promise<Live | undefined> {
    return db
      .updateTable("lives")
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.startsAt !== undefined ? { starts_at: data.startsAt } : {}),
        ...(data.endsAt !== undefined ? { ends_at: data.endsAt } : {}),
      })
      .where("id", "=", liveId)
      .returningAll()
      .executeTakeFirst();
  }

  async schedule(data: {
    name: string;
    host_id: number;
    starts_at: Date;
    ends_at?: Date | null;
    description?: string | null;
  }): Promise<Live> {
    return db
      .insertInto("lives")
      .values({
        name: data.name,
        host_id: data.host_id,
        starts_at: data.starts_at,
        ends_at: data.ends_at ?? null,
        description: data.description ?? null,
        status: "scheduled",
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async start(liveId: number): Promise<Live | undefined> {
    return db
      .updateTable("lives")
      .set({ status: "active" })
      .where("id", "=", liveId)
      .returningAll()
      .executeTakeFirst();
  }

  async endLive(liveId: number): Promise<Live | undefined> {
    const live = await this.findById(liveId);
    const now = new Date();
    const isEarly = live?.ends_at ? now < live.ends_at : false;

    return db
      .updateTable("lives")
      .set({
        status: "ended",
        ended_at: now,
        ...(isEarly ? { session_stopped_at: now } : {}),
      })
      .where("id", "=", liveId)
      .returningAll()
      .executeTakeFirst();
  }

  /** @deprecated use endLive() */
  async endChannel(channelId: number): Promise<Live | undefined> {
    return this.endLive(channelId);
  }

  async isActive(liveId: number): Promise<boolean> {
    const live = await db
      .selectFrom("lives")
      .select(["status"])
      .where("id", "=", liveId)
      .where("status", "=", "active")
      .executeTakeFirst();
    return live !== undefined;
  }

  async getStatus(liveId: number): Promise<string | undefined> {
    const result = await db
      .selectFrom("lives")
      .select(["status"])
      .where("id", "=", liveId)
      .executeTakeFirst();
    return result?.status;
  }

  /**
   * Find the next globally scheduled live (across all vendors), with host info.
   */
  async findNextScheduled(): Promise<
    | (Live & { host_nickname: string; host_avatar_url: string | null })
    | undefined
  > {
    return db
      .selectFrom("lives")
      .innerJoin("users", "users.id", "lives.host_id")
      .select([
        "lives.id",
        "lives.name",
        "lives.host_id",
        "lives.status",
        "lives.max_participants",
        "lives.is_private",
        "lives.starts_at",
        "lives.ends_at",
        "lives.session_stopped_at",
        "lives.description",
        "lives.created_at",
        "lives.ended_at",
        "lives.highlighted_product_id",
        "lives.highlighted_at",
        "users.nickname as host_nickname",
        "users.avatar_url as host_avatar_url",
      ])
      .where("lives.status", "=", "scheduled")
      .where("lives.starts_at", ">", new Date())
      .orderBy("lives.starts_at", "asc")
      .limit(1)
      .executeTakeFirst();
  }

  async isHost(liveId: number, userId: number): Promise<boolean> {
    const live = await db
      .selectFrom("lives")
      .select(["id"])
      .where("id", "=", liveId)
      .where("host_id", "=", userId)
      .executeTakeFirst();
    return live !== undefined;
  }

  async countActiveParticipants(liveId: number): Promise<number> {
    const result = await db
      .selectFrom("live_participants")
      .select(db.fn.countAll<number>().as("count"))
      .where("live_id", "=", liveId)
      .where("left_at", "is", null)
      .executeTakeFirstOrThrow();
    return Number(result.count);
  }

  async hasReachedCapacity(liveId: number): Promise<boolean> {
    const live = await this.findById(liveId);
    if (!live || !live.max_participants) return false;
    const activeCount = await this.countActiveParticipants(liveId);
    return activeCount >= live.max_participants;
  }
}

export const liveRepository = new LiveRepository();
// Backward compat alias
export const channelRepository = liveRepository;

# Ticket 001 — Backend `live.start` mutation

## Goal

Add a host-only `live.start` mutation that transitions a scheduled live to active and returns the same `{ liveStatus: "active", channel, token, appId, uid }` payload that `live.join` returns for an active live. Unlike `live.join`, `live.start` bypasses the `starts_at <= now` check — the host pressing Go Live IS the live starting.

After this ticket nothing changes user-visibly. The iOS rewire in ticket 002 makes it real.

## Acceptance Criteria

- As a seller (live's host), when I call `live.start({ channelId })` before the live's scheduled `starts_at`, the call succeeds and I receive `{ liveStatus: "active", channel, token, appId, uid }`
- As a seller (host), when I call `live.start`, the live's `starts_at` is updated to the current timestamp so the existing `live.join` activeness check (`starts_at <= now`) reports the live as active for buyers too
- As any non-host user, when I call `live.start` on someone else's live, I receive `FORBIDDEN`
- As an unauthenticated user, when I call `live.start`, I receive `UNAUTHORIZED`
- As any user, when I call `live.start` on a live whose `ended_at` is set, I receive `BAD_REQUEST` with "Live is already ended"
- As any user, when I call `live.start` on a live that is already active, I still receive a fresh broadcaster token (idempotent — the host may have reloaded the app)
- `npm run build:server` passes with zero errors from `app/`
- `npm run arch:test` passes

## Technical Strategy

- Backend
  - Router — `app/src/routers/live.ts` (modify)
    - Add `start: protectedProcedure.input(z.object({ channelId: z.number() })).mutation(async ({ input, ctx }) => { … })`
    - Fetch live via `liveRepository.findById(input.channelId)`; throw `NOT_FOUND` if missing
    - Check host: `if (live.host_id !== ctx.user.id) throw FORBIDDEN`. Use the existing `liveRepository.isHost(liveId, userId)` helper if it spares a query, otherwise inline the check
    - Reject ended lives: `if (live.ended_at !== null || (live.ends_at !== null && live.ends_at <= new Date())) throw BAD_REQUEST "Live is already ended"`
    - If `live.starts_at > new Date()`: call a new `liveRepository.updateStartsAt(liveId, new Date())` to bring the live forward to now. Skip if already in the past (live was already active or is starting on time).
    - Generate the Agora token with `role: "host"` — copy the existing block from `live.join` lines 352–358 (`dynamicUid`, `generateAgoraToken({ channelName, uid, role: "host" })`)
    - Return `{ liveStatus: "active" as const, channel: <refetched live with the bumped starts_at>, token, appId: getAgoraAppId(), uid: dynamicUid }` — match the shape returned by `live.join` for the active case so the iOS rewire in ticket 002 is a one-line swap

  - Repository — `app/src/repositories/LiveRepository.ts` (modify)
    - Add `updateStartsAt(liveId: number, startsAt: Date): Promise<void>` that runs an `UPDATE lives SET starts_at = ? WHERE id = ?`
    - Use Kysely's `Updateable<LivesTable>` types per the project convention — no `any`

- Notes
  - `live.start` deliberately does NOT add the user to `live_participants` as a viewer. The host is not a viewer. The existing `messageRouter.send` participant check uses `channelParticipantRepository.isActiveParticipant` — verify the host can chat without being a participant (likely they aren't expected to chat as host, but if they do, the participant check may block). If it blocks, raise it as a follow-up; do not silently add the host as a participant here.
  - `live.start` is `protectedProcedure`, not `publicProcedure`. The existing `live.join` is `publicProcedure` because some flows pre-date the protected wrapper. New code uses `protectedProcedure` per `app/src/CLAUDE.md`.
  - Do not duplicate the activeness derivation. `live.start` always returns `"active"` — there's no other valid outcome (host on a non-ended live always activates).

## Verification

```bash
cd app && npm run build:server && npm run arch:test
```

Manual:
1. Create a live scheduled for 2 hours from now via the existing seller flow on iOS.
2. From any tRPC client (or `curl` with a JWT), call `live.start({ channelId })` as the host → expect `{ liveStatus: "active", token, appId, uid, channel }`.
3. From a different account, call `live.start({ channelId })` on the same live → expect `FORBIDDEN`.
4. Reload the host call → expect a fresh token, still succeeds (idempotency).

## Manual operations to configure services

None.

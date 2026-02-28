# Participant Display Names - Summary

## Overview

Display user names instead of Agora dynamic UIDs in the channel participant list, using a database-backed approach with tRPC polling.

## User Story

As a **viewer or host**, I want to see the real names of participants in a channel so that I know who is watching or streaming.

## Business Goal

- Improve user experience by showing meaningful participant identities
- Replace opaque Agora UIDs (e.g., `57342`) with human-readable display names
- Lay the groundwork for making first/last name mandatory before joining a channel

## Progress Tracking

| Phase   | Description              | Status  |
| ------- | ------------------------ | ------- |
| Phase 1 | Investigation & planning | ✅ DONE |
| Phase 2 | Implementation           | ✅ DONE |

## Files Changed

### Backend

- `app/src/repositories/ChannelParticipantRepository.ts` — Added `getActiveParticipantsWithUserInfo()` method with `INNER JOIN users` to fetch `email`, `firstname`, `lastname` alongside participant data
- `app/src/routers/channel.ts` — Added `channel.participants` tRPC query returning `{ userId, displayName, email, role, joinedAt, isCurrentUser }` with display name fallback logic (`firstname + lastname` → `email`)

### Frontend

- `app/client/src/components/ParticipantList/ParticipantList.tsx` — Full rewrite: removed Agora `IAgoraRTCRemoteUser` dependency, new props `{ channelId, isOpen, onClose }`, uses `trpc.channel.participants.useQuery()` with 5-second polling interval
- `app/client/src/pages/ChannelDetailsPage.tsx` — Updated `<ParticipantList>` call to pass `channelId` instead of `localUserId` and `remoteUsers`

## Tasks Completed

1. **Repository JOIN method** — `getActiveParticipantsWithUserInfo()` queries `channel_participants` with `INNER JOIN users` on `user_id`, filtered by `channel_id` and `left_at IS NULL`, returning user identity fields
2. **tRPC query** — `channel.participants` protected query takes `channelId`, formats display names as `"Firstname Lastname"` with email fallback, marks `isCurrentUser` for the requesting user
3. **ParticipantList rewrite** — Component now fetches its own data via tRPC (5s polling when panel is open), displays initials in avatars, "(you)" badge for current user, crown icon for host role
4. **ChannelDetailsPage update** — Replaced Agora-based props (`localUserId`, `remoteUsers`) with simple `channelId={Number(channelId)}`

## Expected Output

| Aspect                  | Before                    | After                               |
| ----------------------- | ------------------------- | ----------------------------------- |
| **Participant names**   | Agora UID (e.g., `57342`) | Real name (e.g., `Frederic Mamath`) |
| **Data source**         | Agora SDK remote users    | Database via tRPC query             |
| **Refresh mechanism**   | Agora event-driven        | 5-second polling when panel is open |
| **Host identification** | Not shown                 | Crown icon + role label             |
| **Current user**        | Shown as local UID        | Marked with "(you)" badge           |
| **Fallback**            | N/A                       | Email shown if no name set          |

## Future Improvements

- Make first/last name mandatory before joining a channel
- Switch from polling to WebSocket push for real-time participant updates
- Add participant count badge on the toggle button

## Status

✅ COMPLETE

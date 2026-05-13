# App Store Resubmission — Rejection Response

## Initial Prompt

First submission of Popup Live (1.0.0 build 3) was rejected on May 11, 2026 with four issues:

- 5.1.2(i): Privacy tracking declaration incorrectly listed Name as used for tracking → fixed in App Store Connect (no new build required)
- 5.1.1(v): Account deletion missing → already implemented in feature 058, needs new binary + demo video
- 2.1: Demo video required showing Apple Pay card addition on physical device
- 4.1(b): App name "Popup Live" flagged as potentially copying another brand → no competitor found in App Store, reply to Apple required

## Context

- Privacy labels already corrected (ticket-001 step done before ticketing)
- Account deletion is fully implemented and in the codebase (feature 058, tickets 001–006)
- New binary version 1.0.1 has not yet been built or uploaded
- Both demo videos must be recorded on a physical iPhone (not simulator)
- Videos must be hosted externally (Google Drive / Dropbox) and linked in App Store Connect Review Notes

## Out of Scope

- Any new features
- App name change (not required unless Apple rejects the 4.1 reply)
- Trademark registration (longer-term action, not blocking resubmission)

## Tickets

| Ticket     | Description                                         | Status  |
| :--------- | :-------------------------------------------------- | :------ |
| ticket-001 | Reply to Apple on 4.1 Copycats in App Store Connect | done    |
| ticket-002 | Build and upload 1.0.1 binary with account deletion | planned |
| ticket-003 | Record demo videos, fill Review Notes, resubmit     | planned |

## User Stories

| User Story                                                                               | Status  |
| :--------------------------------------------------------------------------------------- | :------ |
| As a submitter, the 4.1 Copycats rejection is addressed via App Store Connect reply      | planned |
| As a submitter, a new binary including account deletion is uploaded to App Store Connect | planned |
| As a submitter, both demo videos are linked in Review Notes and the app is resubmitted   | planned |

# Ticket 005 — Lives list + schedule a live

## Goal

Replace the Lives stub with a real list of the seller's lives split into upcoming and past. A FAB opens a schedule form where the seller picks a name, date/time, description, and optional cover photo.

## Acceptance Criteria

- As a seller, when I open Lives, I see two sections: upcoming lives (sorted ascending by date) and past lives (sorted descending)
- As a seller, each live shows: name, start date formatted as "DD MMM YYYY à HH:mm", and cover image thumbnail if set
- As a seller, when no lives exist, I see an empty state with a prompt to schedule the first live
- As a seller, when I tap the "+" FAB, I see a schedule form
- As a seller, on the form I can fill: name (required), date + time (required, using a native date picker), description (optional), cover photo (optional, same image-pick pattern as products)
- As a seller, when I submit the form, the live is created and appears at the top of the upcoming list
- As a seller, I can swipe-to-delete an upcoming live — a confirm alert appears before deletion

## Technical Strategy

- Screen — `ios-app/app/seller/lives/index.tsx` (replace stub)
  - `live.listByHost.useQuery()` → splits into `upcoming` and `past` from response
  - `SectionList` with two sections, or two `FlatList` blocks within a `ScrollView`
  - Each row: cover thumbnail, name, formatted date string
  - Swipe-to-delete on upcoming items: `Alert.alert` confirm → `live.delete.useMutation()` → optimistic filter on cache
  - FAB: `router.push("/seller/lives/new")`

- Screen — `ios-app/app/seller/lives/new.tsx` (create)
  - Local state: `name`, `startsAt: Date | null`, `description`, `coverBase64`, `coverUri`
  - Date picker: Platform-native via `@react-native-community/datetimepicker` if installed, else use two `TextInput` fields (date YYYY-MM-DD and time HH:MM) with validation
    - Check if `@react-native-community/datetimepicker` is in `package.json`; if yes use it, else use text inputs
  - Cover photo: same `ImagePicker` flow → `image.upload` to get URL before scheduling
  - Submit: validate name + date → `live.schedule.mutate({ name, startsAt: startsAt.toISOString(), description, coverUrl })` → `utils.live.listByHost.invalidate()` → `router.back()`

- Navigation — `ios-app/app/seller/_layout.tsx`
  - Add `lives/index` and `lives/new` to Stack

## Verification

```bash
cd ios-app && npx tsc --noEmit
```

Manual:
1. Open Lives → empty state shown
2. Tap + → schedule form opens
3. Fill name + date → submit → live appears in upcoming list
4. Swipe-delete → confirm alert → live removed

## Manual operations to configure services

None.

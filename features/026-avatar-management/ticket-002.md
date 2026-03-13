# Ticket 002 — Frontend: avatar upload in ProfilePage

## Acceptance Criteria

- As a user, in the profile page, I should see an "Avatar" section at the top
- As a user, in the profile page, when I have an existing avatar, I should see it as a circular preview
- As a user, in the profile page, when I have no avatar, I should see my nickname's first letter in a circle as placeholder
- As a user, in the profile page, when I click "Changer mon avatar", a hidden file input opens (accepts image/\*)
- As a user, in the profile page, when I select a file, I immediately see a local preview (before upload)
- As a user, in the profile page, when I click "Enregistrer l'avatar", the image is uploaded to Cloudinary and saved
- As a user, in the profile page, I see a loading state on the button during the upload

## Technical Strategy

- Frontend
  - Page
    - `app/client/src/pages/ProfilePage.tsx`
      - Add `avatarPreview` state (local preview URL after file selection)
      - Add `selectedFile` state (File object from input)
      - Add `uploadAvatar` mutation using `trpc.image.upload` then `trpc.profile.updateAvatar`
      - Add avatar Card section above "Personal Information" card:
        - Circular preview: `<img>` if `avatarPreview || profile.avatarUrl`, else nickname initial
        - Hidden `<input type="file" accept="image/*">` triggered by ref
        - "Changer" button → click the ref
        - "Enregistrer" button (visible only when `selectedFile` set) → triggers upload flow
        - `FileReader` converts selected file to base64 for local preview + upload
      - On upload success: `utils.profile.me.invalidate()`, reset `selectedFile` + `avatarPreview`

## Manual operations to configure services

- None

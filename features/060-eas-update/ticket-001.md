# ticket-001 — Create Expo account and initialize EAS project

## Acceptance Criteria

- As a developer, I have an Expo account linked to the Popup iOS project
- As a developer, running `eas whoami` in `ios-app/` prints my account name
- As a developer, `ios-app/app.config.ts` contains a valid EAS project ID

## Technical Strategy

This ticket is entirely manual — no code to write beyond pasting the project ID that EAS generates.

## Manual Operations

### 1. Create an Expo account

1. Go to **https://expo.dev**
2. Click **Sign up**
3. Register with your email (`fredericmamath@gmail.com`) or continue with GitHub/Google
4. Verify your email if prompted

---

### 2. Install the EAS CLI

In your terminal (outside any project directory — this is a global install):

```bash
npm install -g eas-cli
```

Verify the install:

```bash
eas --version
# Should print something like: eas-cli/14.x.x ...
```

---

### 3. Log in to EAS

```bash
eas login
```

Enter your Expo account email and password when prompted. Then confirm you are logged in:

```bash
eas whoami
# Should print your Expo username
```

---

### 4. Initialize the EAS project

Navigate to the iOS app directory:

```bash
cd /Users/fredericmamath/freelance/whynot/ios-app
```

Run:

```bash
eas init
```

EAS will ask:
- **"Which Expo account should own this project?"** → select your account
- **"What would you like to name your project?"** → type `popup-ios`
- EAS creates the project and prints a **Project ID** (a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

EAS may automatically write the project ID into `app.config.ts` under `extra.eas.projectId`. If it does, skip step 5. If it does not, proceed to step 5.

---

### 5. Add the project ID to app.config.ts (if not done automatically)

Open `ios-app/app.config.ts`. In the `extra` block, add the EAS project ID:

```typescript
extra: {
  eas: {
    projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  },
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
  // ... rest of existing extra config
},
```

Replace `PASTE_YOUR_PROJECT_ID_HERE` with the UUID printed by `eas init`.

---

### 6. Verify

```bash
eas project:info
# Should print project name, owner, and project ID without errors
```

The app must still pass:

```bash
npx tsc --noEmit
```

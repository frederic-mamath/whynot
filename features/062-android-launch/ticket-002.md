# ticket-002 — Android dev environment + Kotlin stub for agora-viewer

## Goal

Set up the local Android toolchain, register the Samsung Galaxy S23+ for development, and add a **stub** Kotlin module to `modules/agora-viewer/`. The stub has no real Agora SDK code yet — the only goal is to validate that the module registers correctly with Expo's autolinking on Android. This isolates registration bugs from SDK bugs, mirroring the pattern used in `docs/investigations/agora-ios26.md` for iOS.

## Acceptance Criteria

- As a developer, the Samsung Galaxy S23+ is configured for USB debugging and visible via `adb devices`
- As a developer, `modules/agora-viewer/expo-module.config.json` declares both iOS and Android platforms
- As a developer, `modules/agora-viewer/android/` contains a Kotlin module scaffold (`build.gradle`, `AndroidManifest.xml`, `AgoraViewerModule.kt`, `AgoraViewerView.kt`) that compiles
- As a developer, `npx expo prebuild --clean` regenerates `android/` with the module wired up via autolinking
- As a developer, `npx expo run:android -d` builds and installs the app on the S23+ without errors
- As a developer, at app launch on Android, the diagnostic log already present in `src/lib/agora.ts` (`[Agora] Registered expo modules: ...`) lists `AgoraViewer` among the modules — proving registration works before any SDK code is added
- As a developer, the iOS build is unaffected — `npx tsc --noEmit` passes and the iOS app still builds and runs as before

## Technical Strategy

- iOS App (`ios-app/`)
  - Module config
    - `modules/agora-viewer/expo-module.config.json`
      - Change `platforms` from `["ios"]` to `["ios", "android"]`
      - Add an `android` block: `{ "modules": ["expo.modules.agoraviewer.AgoraViewerModule"] }`
  - Android scaffolding *(create)*
    - `modules/agora-viewer/android/build.gradle`
      - Apply `expo-module-gradle-plugin`
      - Kotlin source compatibility, namespace `expo.modules.agoraviewer`
      - No SDK dependencies yet — stub only
    - `modules/agora-viewer/android/src/main/AndroidManifest.xml`
      - Minimal manifest with the package declaration; no permissions, no activities
    - `modules/agora-viewer/android/src/main/java/expo/modules/agoraviewer/AgoraViewerModule.kt`
      - `class AgoraViewerModule : Module()` with `override fun definition() = ModuleDefinition { Name("AgoraViewer") }`
      - No functions / events / views declared yet — pure registration check
    - `modules/agora-viewer/android/src/main/java/expo/modules/agoraviewer/AgoraViewerView.kt`
      - Stub `class AgoraViewerView(context: Context, appContext: AppContext) : ExpoView(context, appContext)` — declared but unused until ticket-003 wires it up

## Manual operations

### 1. Install the Android toolchain

If Android Studio is not yet installed:
1. Download from **https://developer.android.com/studio**
2. During first-run setup, install: Android SDK Platform 35 (or latest), Android SDK Build-Tools, Android Emulator (optional), Android SDK Command-line Tools, Platform-Tools

Set environment variables in `~/.zshrc` (or `~/.bashrc`):

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
```

Reload: `source ~/.zshrc`.

Verify: `adb --version` should print a version.

### 2. Enable USB debugging on the Samsung Galaxy S23+

1. **Paramètres → À propos du téléphone → Informations sur le logiciel**
2. Tap **"Numéro de version"** 7 times in a row → "Vous êtes maintenant développeur" toast appears
3. Back to **Paramètres → Options pour les développeurs**
4. Enable **"Débogage USB"**
5. Connect S23+ via USB-C to the Mac
6. On the S23+, accept the **"Autoriser le débogage USB ?"** prompt (check "Toujours autoriser depuis cet ordinateur")
7. From the terminal: `adb devices` should list a device ID followed by `device` (not `unauthorized`). If it shows `unauthorized`, re-accept the prompt on the phone.

### 3. Build and run

From `ios-app/`:

```bash
npx expo prebuild --clean
npx expo run:android -d
```

`-d` prompts for which device to install on — select the S23+.

### 4. Verify module registration

After the app launches on the S23+, view logs via:

```bash
adb logcat | grep -i "Agora\|expo"
```

Look for the line:

```
[Agora] Registered expo modules: ... AgoraViewer ...
```

If `AgoraViewer` is listed, the stub is registered correctly. If it's missing, the autolinking did not pick up the module — verify `expo-module.config.json` and the Kotlin file paths.

## Out of Scope

- Real Agora SDK integration (deferred to ticket-003)
- Live channel video rendering (deferred to ticket-003)
- Google Pay (deferred to ticket-004)

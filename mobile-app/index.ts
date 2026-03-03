/**
 * Custom entry point required by react-native-unistyles v3 with Expo Router.
 *
 * Expo Router resolves routes before the layout mounts, which means
 * StyleSheet.create() calls in route files run before _layout.tsx.
 * Unistyles' Babel plugin makes those calls lazy, but StyleSheet.configure()
 * still needs to be guaranteed to run before any component renders.
 *
 * Solution:
 * 1. Set "main": "./index.ts" in package.json
 * 2. Import unistyles config FIRST — StyleSheet.configure() must run before
 *    ANY route module is evaluated (route modules call StyleSheet.create eagerly)
 * 3. Import expo-router/entry SECOND — routes load after configure() has run
 */
import "./src/lib/unistyles";
import "expo-router/entry";

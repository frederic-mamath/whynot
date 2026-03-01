import { StyleSheet } from "react-native-unistyles";
import { lightTheme, darkTheme } from "./theme";

/**
 * Register themes and breakpoints with Unistyles.
 * Import this file once at app startup (in app/_layout.tsx).
 */

StyleSheet.configure({
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  settings: {
    adaptiveThemes: true, // Follows OS light/dark mode
  },
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 1024,
  },
});

// TypeScript module augmentation for theme types
declare module "react-native-unistyles" {
  export interface UnistylesThemes {
    light: typeof lightTheme;
    dark: typeof darkTheme;
  }
  export interface UnistylesBreakpoints {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  }
}

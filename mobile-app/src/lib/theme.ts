/**
 * WhyNot Design Tokens
 *
 * Color values extracted from the web app's index.css (oklch converted to hex).
 * These tokens ensure visual consistency between web and mobile.
 */

export const lightTheme = {
  colors: {
    background: "#ffffff",
    foreground: "#261f1d",
    card: "#ffffff",
    cardForeground: "#261f1d",
    primary: "#38302d",
    primaryForeground: "#faf8f6",
    secondary: "#f5f5f4",
    secondaryForeground: "#38302d",
    muted: "#f5f5f4",
    mutedForeground: "#8a7e79",
    accent: "#f5f5f4",
    accentForeground: "#38302d",
    destructive: "#e5484d",
    border: "#e8e5e3",
    input: "#e8e5e3",
    ring: "#b0a8a4",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 10,
    xl: 14,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },
} as const;

export const darkTheme = {
  colors: {
    background: "#261f1d",
    foreground: "#faf8f6",
    card: "#38302d",
    cardForeground: "#faf8f6",
    primary: "#e8e5e3",
    primaryForeground: "#38302d",
    secondary: "#3d3432",
    secondaryForeground: "#faf8f6",
    muted: "#3d3432",
    mutedForeground: "#b0a8a4",
    accent: "#3d3432",
    accentForeground: "#faf8f6",
    destructive: "#f27474",
    border: "rgba(255, 255, 255, 0.1)",
    input: "rgba(255, 255, 255, 0.15)",
    ring: "#8a7e79",
  },
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
  fontSize: lightTheme.fontSize,
} as const;

export type AppTheme = typeof lightTheme;

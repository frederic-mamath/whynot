// AUTO-RUN BY: postinstall / predev / prebuild hooks (web), app.config.ts side-effect (mobile)
// Reads design-tokens/tokens.json, emits two outputs:
//   - app/client/src/styles/tokens.css   (Tailwind v4 :root block)
//   - ios-app/src/theme/tokens.ts        (typed Colors/Spacing/Radius/Typography constants)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TOKENS_PATH = resolve(__dirname, "tokens.json");
const WEB_OUT = resolve(ROOT, "app/client/src/styles/tokens.css");
const MOBILE_OUT = resolve(ROOT, "ios-app/src/theme/tokens.ts");

const REQUIRED_CATEGORIES = ["colors", "spacing", "radius", "typography"];
const REQUIRED_COLOR_PLATFORMS = ["web", "mobile"];
const REQUIRED_TYPOGRAPHY = ["fontFamily", "fontSize", "fontWeight"];

function fail(message) {
  console.error(`design-tokens: ${message}`);
  process.exit(1);
}

function loadTokens() {
  let raw;
  try {
    raw = readFileSync(TOKENS_PATH, "utf8");
  } catch (err) {
    fail(`could not read tokens.json: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail(`tokens.json is not valid JSON: ${err.message}`);
  }
  for (const cat of REQUIRED_CATEGORIES) {
    if (!parsed[cat] || typeof parsed[cat] !== "object") {
      fail(`missing or invalid category "${cat}" in tokens.json`);
    }
  }
  for (const platform of REQUIRED_COLOR_PLATFORMS) {
    if (!parsed.colors[platform] || typeof parsed.colors[platform] !== "object") {
      fail(`missing or invalid colors.${platform} block in tokens.json`);
    }
    for (const [name, value] of Object.entries(parsed.colors[platform])) {
      if (typeof value !== "string" || value.length === 0) {
        fail(`color "${platform}.${name}" must be a non-empty string`);
      }
    }
  }
  for (const key of REQUIRED_TYPOGRAPHY) {
    if (!parsed.typography[key] || typeof parsed.typography[key] !== "object") {
      fail(`missing or invalid typography.${key} in tokens.json`);
    }
  }
  return parsed;
}

// "primary-foreground" -> "primaryForeground"
function kebabToCamel(key) {
  return key.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function generateCss(tokens) {
  const lines = [
    "/* AUTO-GENERATED — do not edit. Source: design-tokens/tokens.json */",
    "",
    ":root {",
    `  --radius: ${tokens.radius.base};`,
  ];
  for (const [name, value] of Object.entries(tokens.colors.web)) {
    lines.push(`  --${name}: ${value};`);
  }
  lines.push("}", "");
  return lines.join("\n");
}

function quote(value) {
  return JSON.stringify(value);
}

function generateTs(tokens) {
  const lines = [
    "// AUTO-GENERATED — do not edit. Source: design-tokens/tokens.json",
    "",
    "export const Colors = {",
  ];
  for (const [name, value] of Object.entries(tokens.colors.mobile)) {
    lines.push(`  ${kebabToCamel(name)}: ${quote(value)},`);
  }
  lines.push("} as const;", "");

  lines.push("export const Spacing = {");
  for (const [name, value] of Object.entries(tokens.spacing)) {
    lines.push(`  ${quote(name)}: ${value},`);
  }
  lines.push("} as const;", "");

  lines.push("export const Radius = {");
  for (const [name, value] of Object.entries(tokens.radius)) {
    if (name === "base") continue;
    lines.push(`  ${quote(name)}: ${value},`);
  }
  lines.push("} as const;", "");

  lines.push("export const Typography = {");
  lines.push("  fontFamily: {");
  for (const [name, value] of Object.entries(tokens.typography.fontFamily)) {
    lines.push(`    ${name}: ${quote(value)},`);
  }
  lines.push("  },");
  lines.push("  fontSize: {");
  for (const [name, value] of Object.entries(tokens.typography.fontSize)) {
    lines.push(`    ${quote(name)}: ${value},`);
  }
  lines.push("  },");
  lines.push("  fontWeight: {");
  for (const [name, value] of Object.entries(tokens.typography.fontWeight)) {
    lines.push(`    ${name}: ${quote(value)} as const,`);
  }
  lines.push("  },");
  lines.push("} as const;", "");
  return lines.join("\n");
}

function writeFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

const tokens = loadTokens();
writeFile(WEB_OUT, generateCss(tokens));
writeFile(MOBILE_OUT, generateTs(tokens));
console.log(`design-tokens: wrote ${WEB_OUT}`);
console.log(`design-tokens: wrote ${MOBILE_OUT}`);

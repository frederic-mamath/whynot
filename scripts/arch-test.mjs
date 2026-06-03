#!/usr/bin/env node
// Regex-based architecture tests for rules R2, R3, R4.
// Layering rules R1, R5, R6 are in app/.dependency-cruiser.cjs.
// Zero npm dependencies — ESM, Node built-ins only.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ─── helpers ──────────────────────────────────────────────────────────────────

function walkDir(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { recursive: true })) {
    if (exts.some((e) => entry.endsWith(e))) {
      results.push(path.join(dir, entry));
    }
  }
  return results;
}

function rel(absPath) {
  return path.relative(ROOT, absPath);
}

let violations = 0;

function check(filePath, patterns, ruleName) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of patterns) {
      if (pattern.test(lines[i])) {
        console.error(
          `[${ruleName}] ${rel(filePath)}:${i + 1} — ${lines[i].trim()}`
        );
        violations++;
        break; // one diagnostic per line per rule is enough
      }
    }
  }
}

// ─── R2 — Headless component pattern ─────────────────────────────────────────
// Pages must not contain tRPC calls, useState, useEffect, useQuery, useMutation.
// Logic goes in the paired *.hooks.ts file.

const R2_PATTERNS = [
  /\bfrom\s+['"]@trpc\//,
  /\buseState\(/,
  /\buseEffect\(/,
  /\buseQuery\(/,
  /\buseMutation\(/,
];

// TODO: the files below violate R2 — migrate logic to *.hooks.ts counterparts
const R2_EXCLUDE = new Set([
  "app/client/src/pages/AccountMergePage.tsx",
  "app/client/src/pages/ShopDetailsPage.tsx",
  "app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx",
  "app/client/src/pages/ChannelCreatePage.tsx",
  "app/client/src/pages/SellerLivesPage/ScheduleLiveDialog.tsx",
  "app/client/src/pages/ChannelListPage.tsx",
  "app/client/src/pages/LiveDetailsPage.old.tsx",
  "app/client/src/pages/ShopCreatePage.tsx",
  "app/client/src/pages/LandingPage.tsx",
  "app/client/src/pages/MyOrdersPage.tsx",
  "app/client/src/pages/ProductUpdatePage.tsx",
  "app/client/src/pages/SellerOnboardingPage/SellerOnboardingPage.tsx",
  "app/client/src/pages/SellerUpsellPage/SellerUpsellPage.tsx",
  "app/client/src/pages/ForgotPasswordPage/ForgotPasswordPage.tsx",
  "app/client/src/pages/ChannelDetailsPage.tsx",
  "app/client/src/pages/ResetPasswordPage/ResetPasswordPage.tsx",
  "app/client/src/pages/SignUpPage/SignUpPage.tsx",
  "app/client/src/pages/SellerShopPage/CreateProductDialog.tsx",
]);

const pagesDir = path.join(ROOT, "app/client/src/pages");
for (const f of walkDir(pagesDir, [".tsx"])) {
  if (f.endsWith(".hooks.ts")) continue; // hooks files are allowed
  if (R2_EXCLUDE.has(rel(f))) continue;
  check(f, R2_PATTERNS, "R2-headless-component");
}

// ─── R3 — No raw Tailwind color classes on web ────────────────────────────────
// Semantic tokens only (bg-primary, text-foreground, etc.).
// See app/client/CLAUDE.md for the allowed token list.

const R3_PATTERN = [
  /\b(?:bg|text|border|ring|fill|stroke)-(?:white|black|gray|zinc|slate|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?\b/,
];

// TODO: the files below violate R3 — replace raw color classes with semantic tokens
const R3_EXCLUDE = new Set([
  "app/client/src/components/PaymentRequiredDialog/PaymentRequiredDialog.tsx",
  "app/client/src/components/ChannelControls/ChannelControls.tsx",
  "app/client/src/components/VerticalControlPanel/VerticalControlPanel.tsx",
  "app/client/src/components/MondialRelayMapDialog/MondialRelayMapDialog.tsx",
  "app/client/src/components/MessageList/MessageList.tsx",
  "app/client/src/components/HighlightedProduct/HighlightedProduct.tsx",
  "app/client/src/components/OAuthButtons/OAuthButtons.tsx",
  "app/client/src/components/MessageInput/MessageInput.tsx",
  "app/client/src/components/PaymentSetupDialog/PaymentSetupDialog.tsx",
  "app/client/src/components/ShopProductItem/ShopProductItem.tsx",
  "app/client/src/components/Message/Message.tsx",
  "app/client/src/components/BidHistory/BidHistory.tsx",
  "app/client/src/components/AssociateProductModal/AssociateProductModal.tsx",
  "app/client/src/components/AuctionWidget/AuctionWidget.tsx",
  "app/client/src/components/NetworkQuality/NetworkQuality.tsx",
  "app/client/src/components/DevicePicker/DevicePicker.tsx",
  "app/client/src/components/AddVendorModal/AddVendorModal.tsx",
  "app/client/src/components/VendorList/VendorList.tsx",
  "app/client/src/components/AuctionCountdown/AuctionCountdown.tsx",
  "app/client/src/components/PaymentDeadlineCountdown/PaymentDeadlineCountdown.tsx",
  "app/client/src/components/ChatPanel/ChatPanel.tsx",
  "app/client/src/components/LiveHighlight/LiveHighlight.tsx",
  "app/client/src/pages/LivesPage/LivesPage.tsx",
  "app/client/src/pages/ShopDetailsPage.tsx",
  "app/client/src/pages/LiveDetailsPage/LiveDetailsPage.tsx",
  "app/client/src/pages/LiveDetailsPage/AuctionCard/AuctionCard.tsx",
  "app/client/src/pages/ProductListPage.tsx",
  "app/client/src/pages/SellerLivesPage/ScheduleLiveDialog.tsx",
  "app/client/src/pages/SellerLivesPage/SellerLivesPage.tsx",
  "app/client/src/pages/LiveDetailsPage.old.tsx",
  "app/client/src/pages/LandingPage.tsx",
  "app/client/src/pages/ProductUpdatePage.tsx",
  "app/client/src/pages/ForgotPasswordPage/ForgotPasswordPage.tsx",
  "app/client/src/pages/ChannelDetailsPage.tsx",
  "app/client/src/pages/ResetPasswordPage/ResetPasswordPage.tsx",
  "app/client/src/pages/DashboardPage.tsx",
  "app/client/src/pages/HomePage.tsx",
]);

const webSrcDir = path.join(ROOT, "app/client/src");
for (const f of walkDir(webSrcDir, [".tsx", ".jsx", ".ts"])) {
  if (f.includes("/lib/") || f.includes("/components/ui/")) continue;
  if (R3_EXCLUDE.has(rel(f))) continue;
  check(f, R3_PATTERN, "R3-no-raw-tailwind-colors");
}

// ─── R4 — No hex codes in mobile ─────────────────────────────────────────────
// Use Colors.* from src/theme/tokens.ts. Only tokens.ts itself may define hex values.

const R4_PATTERNS = [/#[0-9A-Fa-f]{6,8}\b/, /#[0-9A-Fa-f]{3}\b/];

// Files below still hold raw hex codes — to be migrated to Colors.* tokens by
// the remaining tickets in features/072-ios-dark-palette/. SocialAuthButtons is
// kept indefinitely (Apple + Google brand-mandated literal colors).
const R4_EXCLUDE = new Set([
  "ios-app/app/(tabs)/index.tsx",
  "ios-app/app/(tabs)/lives.tsx",
  "ios-app/app/(tabs)/orders.tsx",
  "ios-app/app/+not-found.tsx",
  "ios-app/app/live/[liveId].tsx",
  "ios-app/src/components/AddressForm.tsx",
  "ios-app/src/components/LiveCard.tsx",
  "ios-app/src/components/live/BidRequirementsSheet.tsx",
  "ios-app/src/components/live/HighlightedProduct.tsx",
  "ios-app/src/components/live/AuctionCountdown.tsx",
  "ios-app/src/components/live/AuctionWidget.tsx",
  "ios-app/src/components/live/LiveBadge.tsx",
  "ios-app/src/components/live/PersonalInfoForm.tsx",
  "ios-app/src/components/live/AuctionEndModal.tsx",
  "ios-app/src/components/live/PaymentSetupSheet.tsx",
  "ios-app/src/components/live/ChatPanel.tsx",
  // Apple + Google sign-in: brand guidelines require literal black/white +
  // Google blue (#4285F4) — leaving as-is per ticket-002 authorization.
  "ios-app/src/components/SocialAuthButtons.tsx",
  "ios-app/src/components/OrderCard.tsx",
]);

for (const dir of [
  path.join(ROOT, "ios-app/app"),
  path.join(ROOT, "ios-app/src"),
]) {
  for (const f of walkDir(dir, [".tsx", ".ts"])) {
    if (f.includes("src/theme/tokens")) continue; // tokens.ts is the source of truth
    if (R4_EXCLUDE.has(rel(f))) continue;
    check(f, R4_PATTERNS, "R4-no-mobile-hex");
  }
}

// ─── result ───────────────────────────────────────────────────────────────────

if (violations > 0) {
  console.error(`\n${violations} architecture violation(s) found.`);
  process.exit(1);
} else {
  console.log("Architecture checks passed (R2, R3, R4).");
}

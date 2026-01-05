# Track 007: Page Naming & Architecture Refactor - Summary

## Overview

Standardize page component naming across the application to follow a consistent entity-based `<Entity><Action>Page` naming convention.

## Goal

Rename all pages to follow the `<Entity><Action>Page` pattern (where Action is List, Details, Create, or Update) for consistency, predictability, and scalability.

## Motivation

- **Consistency**: All pages follow the same naming pattern across the codebase
- **Predictability**: Developers instantly know where to find entity-related pages
- **Scalability**: Easy to add new entities in the future (e.g., `OrderListPage`, `OrderDetailsPage`)
- **IDE Support**: Better autocomplete when typing entity names
- **Industry Standard**: Aligns with Next.js App Router and modern React conventions

## Progress Tracking

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Update ARCHITECTURE.md with page naming guidelines | ✅ DONE |
| Phase 2 | Rename Channel pages (3 files) | 📝 PLANNING |
| Phase 3 | Rename Shop pages (3 files) | 📝 PLANNING |
| Phase 4 | Rename Product pages (3 files) | 📝 PLANNING |
| Phase 5 | Verification & testing | 📝 PLANNING |

## Components/Files Affected

### ✅ Completed
- `ARCHITECTURE.md` - Added Frontend Page Architecture section

### ⏳ Remaining

**Channel Pages (3 files)**:
- `ChannelsPage.tsx` → `ChannelListPage.tsx`
- `ChannelPage.tsx` → `ChannelDetailsPage.tsx`
- `CreateChannelPage.tsx` → `ChannelCreatePage.tsx`

**Shop Pages (3 files)**:
- `ShopsPage.tsx` → `ShopListPage.tsx`
- `ShopDetailPage.tsx` → `ShopDetailsPage.tsx`
- `CreateShopPage.tsx` → `ShopCreatePage.tsx`

**Product Pages (3 files)**:
- `ProductsPage.tsx` → `ProductListPage.tsx`
- `CreateProductPage.tsx` → `ProductCreatePage.tsx`
- `EditProductPage.tsx` → `ProductUpdatePage.tsx`

**Other Files to Update (2 files)**:
- `client/src/App.tsx` - Update all imports and route components
- `client/src/pages/ShopLayout.tsx` - Update product page imports

## Naming Convention

### Pattern: `<Entity><Action>Page.tsx`

- **Entity**: Singular noun (Channel, Shop, Product, User)
- **Action**: `List`, `Details`, `Create`, or `Update`

### Examples

| Current Name | New Name | Entity | Action |
|--------------|----------|--------|--------|
| `ChannelsPage` | `ChannelListPage` | Channel | List |
| `ChannelPage` | `ChannelDetailsPage` | Channel | Details |
| `CreateChannelPage` | `ChannelCreatePage` | Channel | Create |
| `ShopsPage` | `ShopListPage` | Shop | List |
| `ShopDetailPage` | `ShopDetailsPage` | Shop | Details |
| `CreateShopPage` | `ShopCreatePage` | Shop | Create |
| `ProductsPage` | `ProductListPage` | Product | List |
| `CreateProductPage` | `ProductCreatePage` | Product | Create |
| `EditProductPage` | `ProductUpdatePage` | Product | Update |

## Metrics

### Before
- Inconsistent naming: `CreateX`, `XPage`, `XsPage`, `XDetailPage`
- 9 pages with mixed conventions
- Difficult to predict file names

### After (Expected)
- Consistent naming: `<Entity><Action>Page`
- 9 pages following single convention
- Predictable file organization
- Better IDE autocomplete

## Status

📝 **PLANNING** - Phase 1 complete (ARCHITECTURE.md updated). Ready to begin code refactoring in Phase 2.

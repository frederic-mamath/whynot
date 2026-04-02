# Ticket 006 — Frontend: extract hooks from remaining pages + remove LiveListPage duplicate

## Acceptance Criteria

- As a developer, the following pages should follow the Page.tsx + Page.hooks.ts pattern with no tRPC calls in JSX:
  - DashboardPage, HomePage, MyOrdersPage, ProductListPage, ShopListPage, LoginPage, SellerShopPage, ProductCreatePage, OnboardingPage, SellerHomePage
- As a developer, `LiveListPage` (identical to `ChannelListPage`) should be deleted and removed from routing

## Technical Strategy

- Frontend
  - Pages *(each split into `.tsx` view + `.hooks.ts` logic)*
    - `DashboardPage.tsx` + `DashboardPage.hooks.ts` — `useDashboard()`
    - `HomePage.tsx` + `HomePage.hooks.ts` — `useHomePage()`
    - `MyOrdersPage.tsx` + `MyOrdersPage.hooks.ts` — `useMyOrdersPage()`, exports `FilterType`
    - `ProductListPage.tsx` + `ProductListPage.hooks.ts` — `useProductListPage()`
    - `ShopListPage.tsx` + `ShopListPage.hooks.ts` — `useShopListPage()`
    - `LoginPage/LoginPage.tsx` + `LoginPage/LoginPage.hooks.ts` — `useLoginPage()`
    - `SellerShopPage/SellerShopPage.tsx` + `SellerShopPage/SellerShopPage.hooks.ts` — `useSellerShopPage()`
    - `ProductCreatePage.tsx` + `ProductCreatePage.hooks.ts` — `useProductCreatePage()`
    - `OnboardingPage.tsx` + `OnboardingPage.hooks.ts` — `useOnboardingPage()`
    - `SellerHomePage.tsx` + `SellerHomePage.hooks.ts` — `useSellerHomePage()`
  - Cleanup
    - `LiveListPage.tsx` *(deleted)* — was functionally identical to ChannelListPage; its import was already unused in App.tsx

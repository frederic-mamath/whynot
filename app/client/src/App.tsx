import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { useState } from "react";
import { trpc, wsClient } from "./lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import SignUpPage from "./pages/SignUpPage/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import ChannelListPage from "./pages/ChannelListPage";
import LiveDetailsPage from "./pages/LiveDetailsPage/LiveDetailsPage";
import ShopListPage from "./pages/ShopListPage";
import ShopCreatePage from "./pages/ShopCreatePage";
import ShopDetailsPage from "./pages/ShopDetailsPage";
import ProductListPage from "./pages/ProductListPage";
import ProductCreatePage from "./pages/ProductCreatePage";
import ProductUpdatePage from "./pages/ProductUpdatePage";
import MyOrdersPage from "./pages/MyOrdersPage";
import SellerDeliveriesPage from "./pages/SellerDeliveriesPage/SellerDeliveriesPage";
import ProfilePage from "./pages/ProfilePage";
import ShopLayout from "./pages/ShopLayout";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountMergePage from "./pages/AccountMergePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage/ResetPasswordPage";
import SellerLayout from "./pages/SellerLayout";
import SellerHomePage from "./pages/SellerHomePage";
import SellerLivesPage from "./pages/SellerLivesPage/SellerLivesPage";
import SellerGoPage from "./pages/SellerGoPage";
import SellerExplorerPage from "./pages/SellerExplorerPage";
import SellerShopPage from "./pages/SellerShopPage/SellerShopPage";
import SellerUpsellPage from "./pages/SellerUpsellPage/SellerUpsellPage";
import SellerOnboardingPage from "./pages/SellerOnboardingPage/SellerOnboardingPage";
import CguPage from "./pages/CguPage";
import PolitiqueConfidentialitePage from "./pages/PolitiqueConfidentialitePage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import SellersPage from "./pages/SellersPage";
import LivesPage from "./pages/LivesPage/LivesPage";
import { Navigate } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import NavBar from "./components/NavBar/NavBar";
import { cn } from "./lib/utils";

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = trpc.profile.me.useQuery(undefined, {
    retry: false,
  });
  if (isLoading) return <>{children}</>;
  if (data) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = trpc.profile.me.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) return null;
  if (data && !data.hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { pathname } = useLocation();
  const { data: profile } = trpc.profile.me.useQuery(undefined, {
    retry: false,
  });
  const showBottomNav = profile?.hasCompletedOnboarding === true;

  // Landing page is full-width — render outside the app shell
  if (pathname === "/") {
    return (
      <>
        <Routes>
          <Route
            path="/"
            element={
              <AuthRedirect>
                <LandingPage />
              </AuthRedirect>
            }
          />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      {showBottomNav && <NavBar />}
      <div
        className={cn(
          "w-full flex-1 mx-auto",
          "px-4 md:px-8 md:max-w-[1024px]",
          showBottomNav && "pb-20 md:pb-0",
        )}
      >
        <Routes>
          <Route path="/" element={null} />
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <LoginPage />
              </AuthRedirect>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirect>
                <SignUpPage />
              </AuthRedirect>
            }
          />
          <Route path="/account-merge" element={<AccountMergePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/cgu" element={<CguPage />} />
          <Route
            path="/politique-de-confidentialite"
            element={<PolitiqueConfidentialitePage />}
          />
          <Route
            path="/dashboard"
            element={
              <OnboardingGuard>
                <DashboardPage />
              </OnboardingGuard>
            }
          />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <HomePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ProfilePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendre"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <SellerUpsellPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller-onboarding"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <SellerOnboardingPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <MyOrdersPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lives"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <LivesPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellers"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <SellersPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route path="/channels" element={<ChannelListPage />} />
          <Route
            path="/live/:liveId"
            element={
              <ProtectedRoute>
                <LiveDetailsPage />
              </ProtectedRoute>
            }
          />
          {/* /channel/:channelId kept for backward compat – will be removed later */}
          <Route
            path="/channel/:liveId"
            element={
              <ProtectedRoute>
                <LiveDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops"
            element={
              <ProtectedRoute requireRole="SELLER">
                <OnboardingGuard>
                  <ShopListPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops/create"
            element={
              <ProtectedRoute requireRole="SELLER">
                <OnboardingGuard>
                  <ShopCreatePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops/:id"
            element={
              <ProtectedRoute requireRole="SELLER">
                <OnboardingGuard>
                  <ShopLayout />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<ShopDetailsPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/create" element={<ProductCreatePage />} />
            <Route
              path="products/:productId/edit"
              element={<ProductUpdatePage />}
            />
          </Route>
          <Route
            path="/seller"
            element={
              <ProtectedRoute requireRole="SELLER">
                <OnboardingGuard>
                  <SellerLayout />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerHomePage />} />
            <Route path="lives" element={<SellerLivesPage />} />
            <Route path="go" element={<SellerGoPage />} />
            <Route path="explorer" element={<SellerExplorerPage />} />
            <Route path="shop" element={<SellerShopPage />} />
            <Route path="livraisons" element={<SellerDeliveriesPage />} />
            <Route
              path="shop/products/create"
              element={<ProductCreatePage />}
            />
            <Route
              path="shop/products/:productId/edit"
              element={<ProductUpdatePage />}
            />
          </Route>
        </Routes>
      </div>
      {showBottomNav && <BottomNav />}
      <Toaster />
    </div>
  );
}

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // Split link: WebSocket for subscriptions, HTTP for everything else
        splitLink({
          condition: (op) => op.type === "subscription",

          // WebSocket link for subscriptions
          true: wsLink({
            client: wsClient,
          }),

          // HTTP link for queries and mutations
          false: httpBatchLink({
            url: "/trpc", // Use relative URL (same domain as frontend)
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
        }),
      ],
    }),
  );
  console.log({
    apiUrl: import.meta.env.VITE_API_URL,
    wsUrl: import.meta.env.VITE_WS_URL,
  });

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

export default App;

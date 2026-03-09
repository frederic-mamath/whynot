import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { useState } from "react";
import { trpc, wsClient } from "./lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./pages/LoginPage/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChannelListPage from "./pages/ChannelListPage";
import ChannelCreatePage from "./pages/ChannelCreatePage";
import ChannelDetailsPage from "./pages/ChannelDetailsPage";
import ShopListPage from "./pages/ShopListPage";
import ShopCreatePage from "./pages/ShopCreatePage";
import ShopDetailsPage from "./pages/ShopDetailsPage";
import ProductListPage from "./pages/ProductListPage";
import ProductCreatePage from "./pages/ProductCreatePage";
import ProductUpdatePage from "./pages/ProductUpdatePage";
import MyOrdersPage from "./pages/MyOrdersPage";
import { PendingDeliveriesPage } from "./pages/PendingDeliveriesPage";
import ProfilePage from "./pages/ProfilePage";
import ShopLayout from "./pages/ShopLayout";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountMergePage from "./pages/AccountMergePage";
import WelcomePage from "./pages/WelcomePage/WelcomePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage/ResetPasswordPage";
import SellerLayout from "./pages/SellerLayout";
import SellerHomePage from "./pages/SellerHomePage";
import SellerLivesPage from "./pages/SellerLivesPage";
import SellerGoPage from "./pages/SellerGoPage";
import SellerExplorerPage from "./pages/SellerExplorerPage";
import SellerShopPage from "./pages/SellerShopPage/SellerShopPage";

function AppContent() {
  return (
    <>
      <div className="max-w-[460px]">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account-merge" element={<AccountMergePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-deliveries"
            element={
              <ProtectedRoute requireRole="SELLER">
                <PendingDeliveriesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/channels" element={<ChannelListPage />} />
          <Route
            path="/create-channel"
            element={
              <ProtectedRoute requireRole="SELLER">
                <ChannelCreatePage />
              </ProtectedRoute>
            }
          />
          <Route path="/channel/:channelId" element={<ChannelDetailsPage />} />
          <Route
            path="/shops"
            element={
              <ProtectedRoute requireRole="SELLER">
                <ShopListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops/create"
            element={
              <ProtectedRoute requireRole="SELLER">
                <ShopCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shops/:id"
            element={
              <ProtectedRoute requireRole="SELLER">
                <ShopLayout />
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
                <SellerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SellerHomePage />} />
            <Route path="lives" element={<SellerLivesPage />} />
            <Route path="go" element={<SellerGoPage />} />
            <Route path="explorer" element={<SellerExplorerPage />} />
            <Route path="shop" element={<SellerShopPage />} />
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
      <Toaster />
    </>
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

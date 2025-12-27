import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "./lib/trpc";
import { getToken } from "./lib/auth";
import NavBar from "./components/NavBar";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChannelsPage from "./pages/ChannelsPage";
import CreateChannelPage from "./pages/CreateChannelPage";
import ChannelPage from "./pages/ChannelPage";
import ShopsPage from "./pages/ShopsPage";
import CreateShopPage from "./pages/CreateShopPage";
import ShopDetailPage from "./pages/ShopDetailPage";
import ProductsPage from "./pages/ProductsPage";
import CreateProductPage from "./pages/CreateProductPage";
import EditProductPage from "./pages/EditProductPage";
import ShopLayout from "./pages/ShopLayout";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/trpc`,
          headers() {
            const token = getToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );
  console.log({ apiUrl: import.meta.env.VITE_API_URL });

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <NavBar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/channels" element={<ChannelsPage />} />
              <Route path="/create-channel" element={<CreateChannelPage />} />
              <Route path="/channel/:channelId" element={<ChannelPage />} />
              <Route path="/shops" element={<ProtectedRoute requireRole="SELLER"><ShopsPage /></ProtectedRoute>} />
              <Route path="/shops/create" element={<ProtectedRoute requireRole="SELLER"><CreateShopPage /></ProtectedRoute>} />
              <Route path="/shops/:id" element={<ProtectedRoute requireRole="SELLER"><ShopLayout /></ProtectedRoute>}>
                <Route index element={<ShopDetailPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/create" element={<CreateProductPage />} />
                <Route
                  path="products/:productId/edit"
                  element={<EditProductPage />}
                />
              </Route>
            </Routes>
            <Toaster />
          </BrowserRouter>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}

export default App;

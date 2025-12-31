import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { useState } from "react";
import { trpc, wsClient } from "./lib/trpc";
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
import { ThemeProvider } from "./components/ThemeProvider";

function AppContent() {
  const location = useLocation();
  const isChannelPage = location.pathname.startsWith('/channel/');

  return (
    <>
      {!isChannelPage && <NavBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/channels" element={<ChannelsPage />} />
        <Route path="/create-channel" element={<ProtectedRoute requireRole="SELLER"><CreateChannelPage /></ProtectedRoute>} />
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
          condition: (op) => op.type === 'subscription',
          
          // WebSocket link for subscriptions
          true: wsLink({
            client: wsClient,
          }),
          
          // HTTP link for queries and mutations
          false: httpBatchLink({
            url: `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/trpc`,
            headers() {
              const token = getToken();
              return token ? { authorization: `Bearer ${token}` } : {};
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
      <ThemeProvider defaultTheme="system" storageKey="whynot-ui-theme">
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

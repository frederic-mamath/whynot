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
import ChannelListPage from "./pages/ChannelListPage";
import ChannelCreatePage from "./pages/ChannelCreatePage";
import ChannelDetailsPage from "./pages/ChannelDetailsPage";
import ShopListPage from "./pages/ShopListPage";
import ShopCreatePage from "./pages/ShopCreatePage";
import ShopDetailsPage from "./pages/ShopDetailsPage";
import ProductListPage from "./pages/ProductListPage";
import ProductCreatePage from "./pages/ProductCreatePage";
import ProductUpdatePage from "./pages/ProductUpdatePage";
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
        <Route path="/channels" element={<ChannelListPage />} />
        <Route path="/create-channel" element={<ProtectedRoute requireRole="SELLER"><ChannelCreatePage /></ProtectedRoute>} />
        <Route path="/channel/:channelId" element={<ChannelDetailsPage />} />
        <Route path="/shops" element={<ProtectedRoute requireRole="SELLER"><ShopListPage /></ProtectedRoute>} />
        <Route path="/shops/create" element={<ProtectedRoute requireRole="SELLER"><ShopCreatePage /></ProtectedRoute>} />
        <Route path="/shops/:id" element={<ProtectedRoute requireRole="SELLER"><ShopLayout /></ProtectedRoute>}>
          <Route index element={<ShopDetailsPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/create" element={<ProductCreatePage />} />
          <Route
            path="products/:productId/edit"
            element={<ProductUpdatePage />}
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
            url: '/trpc', // Use relative URL (same domain as frontend)
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

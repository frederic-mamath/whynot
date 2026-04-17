import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import posthog from "posthog-js";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { debugLog } from "../lib/debug";

export type FilterType =
  | "all"
  | "pending"
  | "paid"
  | "shipped"
  | "failed"
  | "refunded";

export function useMyOrdersPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const {
    data: allOrders,
    isLoading,
    refetch,
  } = trpc.order.getMyOrders.useQuery({
    status: filter === "all" || filter === "shipped" ? undefined : filter,
  });

  const createPayment = trpc.order.createPaymentIntent.useMutation();

  // Handle payment success redirect
  useEffect(() => {
    if (searchParams.get("payment_success") === "true") {
      const orderId = searchParams.get("order_id");
      if (orderId) posthog.capture("order_paid", { order_id: orderId });
      toast.success(t("orders.paymentSuccess"));
      refetch();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refetch]);

  // Filter shipped orders client-side (shipped_at is not null and payment_status is 'paid')
  const orders = allOrders?.filter((order) => {
    if (filter === "shipped") {
      return order.paymentStatus === "shipped";
    }
    return true;
  });

  const handlePayNow = async (orderId: string) => {
    debugLog("🔵 Pay Now clicked for order:", orderId);
    debugLog("🔵 Stripe Promise:", undefined);
    try {
      debugLog("🔵 Calling createPayment...");
      const result = await createPayment.mutateAsync({ orderId });
      debugLog("✅ Result:", result);
      debugLog("✅ Client Secret:", result.clientSecret ? "SET" : "NULL");
      posthog.capture("order_pay_initiated", { order_id: orderId });
      setClientSecret(result.clientSecret || null);
      setPayingOrderId(orderId);
    } catch (error: unknown) {
      console.error("❌ Payment initialization error:", error);
      toast.error((error as { message?: string })?.message || t("orders.failedToInit"));
    }
  };

  const handlePaymentSuccess = () => {
    if (payingOrderId) {
      posthog.capture("order_paid", { order_id: payingOrderId });
    }
    setClientSecret(null);
    setPayingOrderId(null);
    refetch();
    toast.success(t("orders.paymentSuccess"));
  };

  return {
    t,
    filter,
    setFilter,
    payingOrderId,
    setPayingOrderId,
    clientSecret,
    setClientSecret,
    isLoading,
    orders,
    handlePayNow,
    handlePaymentSuccess,
  };
}

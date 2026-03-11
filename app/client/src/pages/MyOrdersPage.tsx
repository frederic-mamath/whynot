import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingBag, Package } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { OrderCard } from "../components/OrderCard";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe";
import { debugLog } from "../lib/debug";

type FilterType =
  | "all"
  | "pending"
  | "paid"
  | "shipped"
  | "failed"
  | "refunded";

function CheckoutForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/my-orders?payment_success=true`,
      },
    });

    if (error) {
      toast.error(error.message || t("orders.paymentFailed"));
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? t("orders.processing") : t("orders.payNow")}
        </Button>
      </div>
    </form>
  );
}

export default function MyOrdersPage() {
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
      toast.success(t("orders.paymentSuccess"));
      refetch();
      // Remove query parameter
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
    debugLog("🔵 Stripe Promise:", stripePromise);
    try {
      debugLog("🔵 Calling createPayment...");
      const result = await createPayment.mutateAsync({ orderId });
      debugLog("✅ Result:", result);
      debugLog("✅ Client Secret:", result.clientSecret ? "SET" : "NULL");
      setClientSecret(result.clientSecret || null);
      setPayingOrderId(orderId);
    } catch (error: any) {
      console.error("❌ Payment initialization error:", error);
      toast.error(error.message || t("orders.failedToInit"));
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    setPayingOrderId(null);
    refetch();
    toast.success(t("orders.paymentSuccess"));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("orders.title")}</h1>
          <p className="text-muted-foreground">{t("orders.subtitle")}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={cn(filter !== "all" && "bg-background")}
          >
            {t("orders.allOrders")}
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={cn(filter !== "pending" && "bg-background")}
          >
            {t("orders.pendingPayment")}
          </Button>
          <Button
            variant={filter === "paid" ? "default" : "outline"}
            onClick={() => setFilter("paid")}
            className={cn(filter !== "paid" && "bg-background")}
          >
            {t("orders.paid")}
          </Button>
          <Button
            variant={filter === "shipped" ? "default" : "outline"}
            onClick={() => setFilter("shipped")}
            className={cn(filter !== "shipped" && "bg-background")}
          >
            {t("orders.shipped")}
          </Button>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </>
          ) : orders && orders.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            orders?.map((order) => (
              <div key={order.id}>
                <OrderCard order={order} onPayNow={handlePayNow} />

                {/* Stripe Payment Form */}
                {payingOrderId === order.id &&
                  clientSecret &&
                  stripePromise && (
                    <div className="mt-4 p-6 border rounded-lg bg-card">
                      <h3 className="text-lg font-semibold mb-4">
                        {t("orders.completePayment")}
                      </h3>
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret }}
                      >
                        <CheckoutForm
                          orderId={order.id}
                          onSuccess={handlePaymentSuccess}
                        />
                      </Elements>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setPayingOrderId(null);
                          setClientSecret(null);
                        }}
                        className="mt-4 w-full"
                      >
                        {t("orders.cancel")}
                      </Button>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="w-full md:w-24 h-48 md:h-24 rounded-md" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterType }) {
  const { t } = useTranslation();

  const getMessage = () => {
    switch (filter) {
      case "pending":
        return t("orders.noPendingOrders");
      case "paid":
        return t("orders.noPaidOrders");
      case "shipped":
        return t("orders.noShippedOrders");
      default:
        return t("orders.noOrders");
    }
  };

  const getDescription = () => {
    if (filter === "all") {
      return t("orders.winToSeeOrders");
    }
    return t("orders.ordersWithStatusWillAppear");
  };

  return (
    <div className="text-center py-12 md:py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <ShoppingBag className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{getMessage()}</h2>
      <p className="text-muted-foreground mb-6">{getDescription()}</p>
      {filter === "all" && (
        <Button asChild>
          <Link to="/lives">
            <Package className="size-4 mr-2" />
            {t("orders.browseChannels")}
          </Link>
        </Button>
      )}
      {filter !== "all" && (
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("orders.viewAllOrders")}
        </Button>
      )}
    </div>
  );
}

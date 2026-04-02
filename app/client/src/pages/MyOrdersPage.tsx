import { useTranslation } from "react-i18next";
import { ShoppingBag, Package } from "lucide-react";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import { Skeleton } from "../components/ui/skeleton";
import { OrderCard } from "../components/OrderCard";
import { cn } from "../lib/utils";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../lib/stripe";
import { useState } from "react";
import { toast } from "sonner";
import { useMyOrdersPage, type FilterType } from "./MyOrdersPage.hooks";

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
        <ButtonV2
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-primary text-primary-foreground"
          label={loading ? t("orders.processing") : t("orders.payNow")}
        />
      </div>
    </form>
  );
}

export default function MyOrdersPage() {
  const {
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
  } = useMyOrdersPage();

  return (
    <div className="min-h-[calc(100vh - 160px)] bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("orders.title")}</h1>
          <p className="text-muted-foreground">{t("orders.subtitle")}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <ButtonV2
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}
            label={t("orders.allOrders")}
          />
          <ButtonV2
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}
            label={t("orders.pendingPayment")}
          />
          <ButtonV2
            onClick={() => setFilter("paid")}
            className={filter === "paid" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}
            label={t("orders.paid")}
          />
          <ButtonV2
            onClick={() => setFilter("shipped")}
            className={filter === "shipped" ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}
            label={t("orders.shipped")}
          />
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
                      <ButtonV2
                        onClick={() => {
                          setPayingOrderId(null);
                          setClientSecret(null);
                        }}
                        className="mt-4 w-full bg-transparent text-foreground"
                        label={t("orders.cancel")}
                      />
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
        <ButtonV2
          icon={<Package className="size-4" />}
          label={t("orders.browseChannels")}
          onClick={() => window.location.assign("/lives")}
          className="bg-primary text-primary-foreground"
        />
      )}
      {filter !== "all" && (
        <ButtonV2
          className="border border-border bg-background text-foreground"
          onClick={() => window.location.reload()}
          label={t("orders.viewAllOrders")}
        />
      )}
    </div>
  );
}

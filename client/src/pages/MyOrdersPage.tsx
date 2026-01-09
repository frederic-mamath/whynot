import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Package } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { OrderCard } from "../components/OrderCard";
import { toast } from "sonner";
import { cn } from "../lib/utils";

type FilterType = "all" | "pending" | "paid" | "shipped" | "failed" | "refunded";

export default function MyOrdersPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: allOrders, isLoading } = trpc.order.getMyOrders.useQuery({
    status: filter === "all" || filter === "shipped" ? undefined : filter,
  });

  // Filter shipped orders client-side (shipped_at is not null and payment_status is 'paid')
  const orders = allOrders?.filter(order => {
    if (filter === "shipped") {
      return order.paymentStatus === "shipped";
    }
    return true;
  });

  const handlePayNow = (orderId: string) => {
    toast.info("Payment integration coming in Phase 8");
    // Future: Open Stripe checkout
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your auction wins
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={cn(filter !== "all" && "bg-background")}
          >
            All Orders
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className={cn(filter !== "pending" && "bg-background")}
          >
            Pending Payment
          </Button>
          <Button
            variant={filter === "paid" ? "default" : "outline"}
            onClick={() => setFilter("paid")}
            className={cn(filter !== "paid" && "bg-background")}
          >
            Paid
          </Button>
          <Button
            variant={filter === "shipped" ? "default" : "outline"}
            onClick={() => setFilter("shipped")}
            className={cn(filter !== "shipped" && "bg-background")}
          >
            Shipped
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
              <OrderCard key={order.id} order={order} onPayNow={handlePayNow} />
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
  const getMessage = () => {
    switch (filter) {
      case "pending":
        return "You have no pending orders";
      case "paid":
        return "You have no paid orders";
      case "shipped":
        return "You have no shipped orders";
      default:
        return "No orders yet";
    }
  };

  const getDescription = () => {
    if (filter === "all") {
      return "Win an auction to see your orders here";
    }
    return "Orders with this status will appear here";
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
          <Link to="/channels">
            <Package className="size-4 mr-2" />
            Browse Channels
          </Link>
        </Button>
      )}
      {filter !== "all" && (
        <Button variant="outline" onClick={() => window.location.reload()}>
          View All Orders
        </Button>
      )}
    </div>
  );
}

import { Package, User, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { PaymentDeadlineCountdown } from "../PaymentDeadlineCountdown";
import { cn } from "../../lib/utils";

interface OrderCardProps {
  order: {
    id: string;
    productName: string;
    productImageUrl: string | null;
    sellerUsername: string;
    finalPrice: number;
    platformFee: number;
    sellerPayout: number;
    paymentStatus: "pending" | "paid" | "shipped" | "failed" | "refunded";
    paymentDeadline: string;
    createdAt: string;
  };
  onPayNow: (orderId: string) => void;
}

export function OrderCard({ order, onPayNow }: OrderCardProps) {
  const isPending = order.paymentStatus === "pending";
  const isPaid = order.paymentStatus === "paid";
  const isShipped = order.paymentStatus === "shipped";
  const isFailed = order.paymentStatus === "failed";
  const isRefunded = order.paymentStatus === "refunded";

  const isExpired = isPending && new Date(order.paymentDeadline) < new Date();

  const getStatusBadgeVariant = () => {
    if (isFailed || isExpired) return "destructive";
    if (isPending) return "secondary";
    if (isPaid) return "default";
    if (isShipped) return "default";
    if (isRefunded) return "secondary";
    return "secondary";
  };

  const getStatusText = () => {
    if (isExpired) return "Expired";
    if (isFailed) return "Payment Failed";
    if (isRefunded) return "Refunded";
    if (isPending) return "Pending Payment";
    if (isPaid) return "Paid - Awaiting Shipment";
    if (isShipped) return "Shipped";
    return order.paymentStatus;
  };

  const itemPrice = order.finalPrice - order.platformFee;

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Product Image */}
          <div className="w-full md:w-24 h-48 md:h-24 rounded-md overflow-hidden bg-muted shrink-0">
            {order.productImageUrl ? (
              <img
                src={order.productImageUrl}
                alt={order.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="size-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{order.productName}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <User className="size-4" />
                  <span>Seller: {order.sellerUsername}</span>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant()} className={cn(
                isPaid && "bg-green-500 hover:bg-green-600",
                isShipped && "bg-blue-500 hover:bg-blue-600"
              )}>
                {getStatusText()}
              </Badge>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Price:</span>
                <span>${itemPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (7%):</span>
                <span>${order.platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Total:</span>
                <span>${order.finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Deadline */}
            {isPending && !isExpired && (
              <div className="pt-2">
                <PaymentDeadlineCountdown deadline={order.paymentDeadline} />
              </div>
            )}

            {/* Expired Message */}
            {isExpired && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                This order has expired. Payment was due by{" "}
                {new Date(order.paymentDeadline).toLocaleDateString()}.
              </div>
            )}

            {/* Order Date */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Calendar className="size-3" />
              <span>
                Ordered on {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isPending && !isExpired && (
                <Button
                  onClick={() => onPayNow(order.id)}
                  className="w-full md:w-auto"
                >
                  <CreditCard className="size-4 mr-2" />
                  Pay Now
                </Button>
              )}
              {isPaid && (
                <div className="text-sm text-muted-foreground">
                  Your payment has been received. The seller will ship your order soon.
                </div>
              )}
              {isShipped && (
                <div className="text-sm text-muted-foreground">
                  Your order has been shipped!
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

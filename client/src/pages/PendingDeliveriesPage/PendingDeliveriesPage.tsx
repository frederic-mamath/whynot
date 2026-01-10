import { trpc } from '@/lib/trpc';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, User, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function PendingDeliveriesPage() {
  const utils = trpc.useUtils();

  const { data: orders, isLoading } = trpc.order.getPendingDeliveries.useQuery();

  const markAsShipped = trpc.order.markAsShipped.useMutation({
    onSuccess: () => {
      toast.success('Order Shipped', {
        description: 'The buyer will be notified.',
      });
      utils.order.getPendingDeliveries.invalidate();
    },
    onError: (error) => {
      toast.error('Failed to Mark as Shipped', {
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pending Deliveries
            </CardTitle>
            <CardDescription>
              Orders waiting to be shipped
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              No pending deliveries. All orders have been shipped!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pending Deliveries
          </CardTitle>
          <CardDescription>
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} waiting to be shipped
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    {/* Product Image */}
                    {order.productImageUrl && (
                      <img
                        src={order.productImageUrl}
                        alt={order.productName}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}

                    {/* Order Details */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="font-semibold">{order.productName}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {order.buyerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${order.finalPrice.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Paid {formatDistanceToNow(new Date(order.paidAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <Badge variant="secondary">Payment Received</Badge>
                    </div>

                    {/* Ship Button */}
                    <Button
                      onClick={() => markAsShipped.mutate({ orderId: order.id })}
                      disabled={markAsShipped.isPending}
                      className="w-full md:w-auto"
                    >
                      Mark as Shipped
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

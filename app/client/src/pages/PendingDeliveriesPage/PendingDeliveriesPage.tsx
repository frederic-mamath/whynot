import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Package, User, DollarSign, Calendar, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

function PayoutRequestDialog({ order }: { order: any }) {
  const [open, setOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const utils = trpc.useUtils();

  const createPayout = trpc.payout.createRequest.useMutation({
    onSuccess: () => {
      toast.success('Payout Request Submitted', {
        description: 'Your request will be processed shortly.',
      });
      setOpen(false);
      setPaymentMethod('');
      setPaymentDetails('');
      utils.order.getPendingDeliveries.invalidate();
    },
    onError: (error) => {
      toast.error('Failed to Request Payout', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod.trim() || !paymentDetails.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createPayout.mutate({
      orderId: order.id,
      paymentMethod: paymentMethod.trim(),
      paymentDetails: paymentDetails.trim(),
    });
  };

  // Calculate seller payout (93% of final price)
  const sellerPayout = order.finalPrice * 0.93;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full md:w-auto">
          <Wallet className="h-4 w-4 mr-2" />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Request payment for this order. Platform fee (7%) will be deducted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Product</Label>
            <p className="text-sm text-muted-foreground">{order.productName}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Order Total</Label>
              <p className="text-lg font-bold">${order.finalPrice.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Your Payout (93%)</Label>
              <p className="text-lg font-bold text-green-600">${sellerPayout.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Input
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="e.g., PayPal, Bank Transfer, Venmo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDetails">Payment Details *</Label>
            <Textarea
              id="paymentDetails"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder="e.g., your email, IBAN, account number, etc."
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide information needed to send you the payment
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createPayout.isPending} className="flex-1">
              {createPayout.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <Button
                        onClick={() => markAsShipped.mutate({ orderId: order.id })}
                        disabled={markAsShipped.isPending}
                        className="w-full md:w-auto"
                      >
                        Mark as Shipped
                      </Button>
                      <PayoutRequestDialog order={order} />
                    </div>
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

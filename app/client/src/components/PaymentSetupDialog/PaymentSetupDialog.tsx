import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../../lib/stripe";
import { trpc } from "../../lib/trpc";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// ─── Inner form rendered inside <Elements> ──────────────────────────

function SetupForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile?payment_setup=true`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Failed to save payment method");
    } else {
      toast.success("Payment method saved!");
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Save payment method
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Dialog wrapper ─────────────────────────────────────────────────

interface PaymentSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** When true, the user cannot dismiss the dialog (must complete setup) */
  blocking?: boolean;
  title?: string;
  description?: string;
}

export function PaymentSetupDialog({
  open,
  onOpenChange,
  onSuccess,
  blocking = false,
  title = "Add a payment method",
  description = "Add a card, Apple Pay, or Google Pay. Your payment method will be saved for future purchases.",
}: PaymentSetupDialogProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const { mutate: createSetupIntent, isPending } =
    trpc.payment.createSetupIntent.useMutation({
      onSuccess: (data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setSetupError(null);
        } else {
          setSetupError(
            "Stripe returned an empty client secret. Please try again.",
          );
        }
      },
      onError: (err) => {
        setSetupError(err.message || "Failed to start payment setup");
        toast.error(err.message || "Failed to start payment setup");
      },
    });

  // Trigger SetupIntent creation when the dialog opens.
  // Important: keep the dependency array minimal — only `open`.
  // All guards are removed to avoid stale closure issues in production.
  useEffect(() => {
    // Always reset state on open/close to avoid leftover stale data
    setClientSecret(null);
    setDone(false);
    setSetupError(null);
    if (open) {
      createSetupIntent();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Request a SetupIntent when the dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    // If blocking, don't allow dismissal unless done
    if (!nextOpen && blocking && !done) return;
    onOpenChange(nextOpen);
  };

  const handleSuccess = () => {
    setDone(true);
    onSuccess?.();
    // Close after a brief moment so the user sees the success state
    setTimeout(() => {
      onOpenChange(false);
      setClientSecret(null);
      setDone(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md flex flex-col max-h-[90dvh] p-0 gap-0"
        // Prevent closing by clicking outside when blocking
        onInteractOutside={
          blocking && !done ? (e) => e.preventDefault() : undefined
        }
      >
        {/* Fixed header */}
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 flex-1">
          {done ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm text-muted-foreground">
                Payment method saved successfully!
              </p>
            </div>
          ) : setupError || (clientSecret && !stripePromise) ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-sm text-destructive text-center">
                {setupError ??
                  "Stripe is not configured. Make sure VITE_STRIPE_PUBLISHABLE_KEY is set in the build environment."}
              </p>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setSetupError(null);
                  createSetupIntent();
                }}
              >
                Try again
              </Button>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <SetupForm onSuccess={handleSuccess} />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentRequestButtonElement,
  useStripe,
} from "@stripe/react-stripe-js";
import type { PaymentRequest } from "@stripe/stripe-js";
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
import { Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// ─── Wallet-only setup form (Google Pay / Apple Pay) ────────────────

function WalletSetupForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null,
  );
  // null = still checking, true = available, false = unavailable
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "FR",
      currency: "eur",
      total: {
        label: "Enregistrer un moyen de paiement",
        amount: 0,
      },
      requestPayerName: false,
      requestPayerEmail: false,
    });

    pr.canMakePayment().then((result) => {
      setAvailable(!!result);
      if (result) setPaymentRequest(pr);
    });

    pr.on("paymentmethod", async (event) => {
      const { error } = await stripe.confirmCardSetup(
        clientSecret,
        { payment_method: event.paymentMethod.id },
        { handleActions: false },
      );

      if (error) {
        event.complete("fail");
        toast.error(error.message || "Échec de l'enregistrement");
      } else {
        event.complete("success");
        toast.success("Moyen de paiement enregistré !");
        onSuccess();
      }
    });
  }, [stripe, clientSecret]); // eslint-disable-line react-hooks/exhaustive-deps

  if (available === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">
          Google Pay et Apple Pay ne sont pas disponibles sur ce navigateur ou
          cet appareil.
        </p>
        <p className="text-xs text-muted-foreground">
          Utilisez Chrome avec un compte Google Wallet configuré, ou Safari sur
          iOS/macOS avec Apple Pay.
        </p>
      </div>
    );
  }

  return paymentRequest ? (
    <div className="py-2">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: "default",
              theme: "dark",
              height: "48px",
            },
          },
        }}
      />
    </div>
  ) : null;
}

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
  title = "Moyen de paiement",
  description = "Enregistrez Google Pay ou Apple Pay pour pouvoir enchérir.",
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
            <Wallet className="h-5 w-5" />
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
                Moyen de paiement enregistré !
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
                Réessayer
              </Button>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise}>
              <WalletSetupForm
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
              />
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

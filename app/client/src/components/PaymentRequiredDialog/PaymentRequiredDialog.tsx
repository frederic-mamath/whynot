import { useState, useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { PaymentSetupDialog } from "../PaymentSetupDialog";

/**
 * Detect which wallet name to show based on the browser/OS.
 */
function getWalletSuggestion(): string {
  const ua = navigator.userAgent.toLowerCase();
  const isApple =
    /iphone|ipad|ipod|macintosh/.test(ua) && "ontouchend" in document;
  const isMac = /macintosh/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isApple || isMac) return "Apple Pay";
  if (isAndroid) return "Google Pay";
  return "Apple Pay or Google Pay";
}

interface PaymentRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the user successfully saves a payment method */
  onSuccess: () => void;
}

/**
 * Blocking dialog that forces the user to add a payment method before bidding.
 * Embeds the PaymentSetupDialog inline.
 */
export function PaymentRequiredDialog({
  open,
  onOpenChange,
  onSuccess,
}: PaymentRequiredDialogProps) {
  const [showSetup, setShowSetup] = useState(false);
  const wallet = useMemo(getWalletSuggestion, []);

  if (showSetup) {
    return (
      <PaymentSetupDialog
        open={open}
        onOpenChange={(next: boolean) => {
          if (!next) setShowSetup(false);
          onOpenChange(next);
        }}
        onSuccess={() => {
          setShowSetup(false);
          onSuccess();
        }}
        blocking
        title="Moyen de paiement requis"
        description={`Enregistrez ${wallet} pour pouvoir enchérir.`}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Payment method required
          </DialogTitle>
          <DialogDescription>
            You must add a payment method before placing a bid or buying out an
            auction. This ensures the seller will receive payment if you win.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            We accept cards, {wallet}, and other payment methods via Stripe. You
            won't be charged until you win an auction and confirm the purchase.
          </p>

          <button
            type="button"
            onClick={() => setShowSetup(true)}
            className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Set up payment method
          </button>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

export interface BidRequirement {
  id: string;
  label: string;
  description: string;
  done: boolean;
  onComplete: () => void;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: BidRequirement[];
  onAllComplete: () => void;
}

export function BidRequirementsDialog({
  open,
  onOpenChange,
  requirements,
  onAllComplete,
}: Props) {
  const allDone = requirements.every((r) => r.done);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Pour pouvoir enchérir</DialogTitle>
          <DialogDescription>
            Complétez les étapes suivantes avant de placer votre enchère.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          {requirements.map((req, index) => (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border border-border",
                req.done && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold",
                  req.done
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {req.done ? <Check size={16} /> : index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {req.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {req.description}
                </div>
              </div>
              {!req.done && (
                <button
                  type="button"
                  onClick={req.onComplete}
                  className="shrink-0 text-xs font-semibold text-primary underline underline-offset-2"
                >
                  Configurer
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onAllComplete();
              onOpenChange(false);
            }}
            disabled={!allDone}
            className={cn(
              "w-full rounded-full py-3 text-sm font-semibold transition-colors",
              allDone
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            Enchèrir
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-sm text-muted-foreground py-1"
          >
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

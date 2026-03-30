import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weightInput: string;
  onWeightChange: (v: string) => void;
  weightError: string;
  onSubmit: () => void;
  isPending: boolean;
}

export default function GenerateLabelDialog({
  open,
  onOpenChange,
  weightInput,
  onWeightChange,
  weightError,
  onSubmit,
  isPending,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-syne font-bold">
            Générer une étiquette
          </DialogTitle>
          <DialogDescription className="font-outfit">
            Entrez le poids total du colis en grammes avant de générer
            l'étiquette Mondial Relay.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="font-outfit">Poids du colis (en grammes)</Label>
            <Input
              type="number"
              placeholder="ex: 500"
              value={weightInput}
              onChange={onWeightChange}
            />
            {weightError && (
              <p className="text-sm text-destructive font-outfit">
                {weightError}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-outfit">
            Livraison domicile — bientôt disponible
          </p>
        </div>

        <DialogFooter className="gap-2">
          <ButtonV2
            label="Annuler"
            onClick={() => onOpenChange(false)}
            className="border border-border bg-background text-foreground"
          />
          <ButtonV2
            label={isPending ? "Génération…" : "Générer"}
            onClick={onSubmit}
            disabled={isPending}
            className="bg-primary text-primary-foreground"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

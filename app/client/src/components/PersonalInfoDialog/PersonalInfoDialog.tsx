import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import Input from "../ui/Input/Input";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFirstName?: string;
  initialLastName?: string;
  onSave: (firstName: string, lastName: string) => void;
}

export function PersonalInfoDialog({
  open,
  onOpenChange,
  initialFirstName = "",
  initialLastName = "",
  onSave,
}: Props) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave(firstName.trim(), lastName.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informations personnelles</DialogTitle>
          <DialogDescription>
            Votre prénom et nom sont requis pour la livraison.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Prénom
            </label>
            <Input
              type="text"
              placeholder="Entrez votre prénom"
              value={firstName}
              onChange={setFirstName}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Nom</label>
            <Input
              type="text"
              placeholder="Entrez votre nom"
              value={lastName}
              onChange={setLastName}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className={cn(
              "w-full rounded-full py-3 text-sm font-semibold transition-colors",
              isValid
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            Enregistrer
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

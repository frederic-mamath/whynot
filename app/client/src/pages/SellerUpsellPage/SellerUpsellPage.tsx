import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Clock, Receipt, Users } from "lucide-react";
import ButtonV2 from "@/components/ui/ButtonV2";

const BENEFITS = [
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Vendez en secondes, pas en jours",
    description:
      "Vendre en live, c'est vendre vite. Gagnez plus par heure que sur n'importe quelle autre marketplace.",
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    title: "Gardez plus de ce que vous gagnez",
    description:
      "La commission de Popup — 6,67 % + TVA — est l'une des plus basses du secteur.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Vendez aux meilleurs acheteurs",
    description:
      "Les acheteurs en live show sont plus engagés, plus fidèles et plus enclins à dépenser.",
  },
];

export default function SellerUpsellPage() {
  const utils = trpc.useUtils();

  const requestSellerRole = trpc.role.requestSellerRole.useMutation({
    onSuccess: () => {
      toast.success("Demande envoyée !", {
        description:
          "Votre demande est en cours de validation par notre équipe.",
      });
      utils.role.myRoles.invalidate();
    },
    onError: (error) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  const hasPendingRequest = requestSellerRole.isSuccess;

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        "min-h-[calc(100vh - 160px)]",
        "bg-background text-foreground",
        "px-6 py-10",
        "gap-8",
      )}
    >
      {/* Floating product images */}
      <div className={cn("flex justify-center gap-4 w-full", "mt-4")}>
        {[
          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg",
        ].map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-16 h-16 rounded-2xl bg-muted",
              "overflow-hidden",
              "border border-border",
            )}
          />
        ))}
      </div>

      {/* Title */}
      <h1 className={cn("text-3xl font-syne font-extrabold text-center")}>
        Intéressé par la vente ?
      </h1>

      {/* Benefits */}
      <div className={cn("flex flex-col gap-6 w-full")}>
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className={cn("flex gap-4 items-start")}>
            <div
              className={cn(
                "shrink-0",
                "w-10 h-10 rounded-full",
                "bg-muted",
                "flex items-center justify-center",
                "text-foreground",
              )}
            >
              {benefit.icon}
            </div>
            <div>
              <p className={cn("font-bold text-sm")}>{benefit.title}</p>
              <p className={cn("text-muted-foreground text-sm mt-0.5")}>
                {benefit.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className={cn("w-full mt-auto pt-6")}>
        <ButtonV2
          className={cn(
            "w-full",
            hasPendingRequest
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground",
          )}
          label={
            hasPendingRequest
              ? "Demande envoyée — en attente de validation"
              : "Commencer à vendre"
          }
          disabled={requestSellerRole.isPending || hasPendingRequest}
          onClick={() => requestSellerRole.mutate()}
        />
      </div>
    </div>
  );
}

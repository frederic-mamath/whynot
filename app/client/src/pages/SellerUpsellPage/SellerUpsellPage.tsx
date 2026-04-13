import { cn } from "@/lib/utils";
import { useNavigate, Navigate } from "react-router-dom";
import { Clock, Receipt, Users } from "lucide-react";
import ButtonV2 from "@/components/ui/ButtonV2";
import { trpc } from "@/lib/trpc";

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
  const navigate = useNavigate();
  const { data: userRoles } = trpc.role.myRoles.useQuery();
  const isSeller = userRoles?.roles.includes("SELLER") ?? false;

  if (isSeller) return <Navigate to="/seller/shop" replace />;

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        "min-h-[calc(100vh - 160px)]",
        "bg-background text-foreground",
        "py-10",
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
          className="w-full bg-primary text-primary-foreground"
          label="Commencer à vendre"
          onClick={() => navigate("/seller-onboarding")}
        />
      </div>
    </div>
  );
}

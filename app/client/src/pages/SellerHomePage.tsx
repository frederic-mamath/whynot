import { cn } from "@/lib/utils";
import { useSellerHomePage } from "./SellerHomePage.hooks";

export default function SellerHomePage() {
  const { navigate, cards } = useSellerHomePage();

  return (
    <div className="py-6">
      <h1 className="font-syne font-extrabold text-2xl text-foreground mb-6">
        Ma boutique
      </h1>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.num}
            onClick={() => navigate(card.route)}
            className={cn(
              "bg-card border border-border rounded-2xl p-4",
              "flex flex-col gap-2 text-left",
              "hover:border-primary/40 active:scale-[0.98] transition-all",
            )}
          >
            <p className="font-outfit font-bold text-sm text-foreground leading-tight">
              {card.num}. {card.title}
            </p>
            <p className="text-xs text-muted leading-snug line-clamp-2">
              {card.subtitle}
            </p>
            <div className="bg-muted/20 rounded-xl h-20 flex items-center justify-center mt-1">
              {card.icon}
            </div>
            {card.count !== undefined && (
              <p
                className={cn(
                  "text-xs mt-0.5 font-outfit",
                  card.highlight ? "text-primary font-semibold" : "text-muted",
                )}
              >
                {card.count}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

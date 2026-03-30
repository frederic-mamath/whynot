import { useNavigate } from "react-router-dom";
import { Package, Video, Truck, BarChart2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { cn } from "@/lib/utils";

export default function SellerHomePage() {
  const navigate = useNavigate();

  const { data: shop } = trpc.shop.getOrCreateMyShop.useQuery();
  const { data: products } = trpc.product.list.useQuery(
    { shopId: shop?.id ?? 0 },
    { enabled: !!shop?.id },
  );
  const { data: livesData } = trpc.live.listByHost.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const { data: deliveries } = trpc.order.getPendingDeliveries.useQuery();

  const productCount = products?.length;
  const upcomingCount = livesData?.upcoming?.length;
  const deliveryCount = deliveries?.length;

  const cards = [
    {
      num: 1,
      title: "Inventaire",
      subtitle: "Créez votre liste de produits et gérez votre stock",
      icon: <Package className="w-8 h-8 text-primary" />,
      route: "/seller/shop",
      count:
        productCount !== undefined
          ? `${productCount} produit${productCount !== 1 ? "s" : ""}`
          : "—",
      highlight: false,
    },
    {
      num: 2,
      title: "Lives",
      subtitle: "Donnez rendez-vous à vos clients en programmant vos lives",
      icon: <Video className="w-8 h-8 text-primary" />,
      route: "/seller/lives",
      count:
        upcomingCount !== undefined
          ? `${upcomingCount} live${upcomingCount !== 1 ? "s" : ""} à venir`
          : "—",
      highlight: false,
    },
    {
      num: 3,
      title: "Livraisons",
      subtitle:
        "Suivez les commandes de vos clients et ajoutez les liens de suivi",
      icon: <Truck className="w-8 h-8 text-primary" />,
      route: "/seller/livraisons",
      count:
        deliveryCount !== undefined
          ? `${deliveryCount} commande${deliveryCount !== 1 ? "s" : ""}`
          : "—",
      highlight: (deliveryCount ?? 0) > 0,
    },
    {
      num: 4,
      title: "Analytics et dashboard",
      subtitle: "Retirez votre argent et gardez un œil sur vos statistiques",
      icon: <BarChart2 className="w-8 h-8 text-muted" />,
      route: "/seller/explorer",
      count: undefined,
      highlight: false,
    },
  ];

  return (
    <div className="px-4 py-6">
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

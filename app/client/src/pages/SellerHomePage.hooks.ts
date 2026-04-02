import { useNavigate } from "react-router-dom";
import { Package, Video, Truck, BarChart2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import React from "react";

export function useSellerHomePage() {
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
      icon: React.createElement(Package, { className: "w-8 h-8 text-primary" }),
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
      icon: React.createElement(Video, { className: "w-8 h-8 text-primary" }),
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
      icon: React.createElement(Truck, { className: "w-8 h-8 text-primary" }),
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
      icon: React.createElement(BarChart2, { className: "w-8 h-8 text-muted" }),
      route: "/seller/explorer",
      count: undefined,
      highlight: false,
    },
  ];

  return {
    navigate,
    cards,
  };
}

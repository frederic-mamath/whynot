import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";

export function useSellerShopPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: shop, isLoading } = trpc.shop.getOrCreateMyShop.useQuery();

  const { data: products, refetch: refetchProducts } =
    trpc.product.list.useQuery(
      { shopId: shop?.id ?? 0 },
      { enabled: !!shop?.id },
    );

  return {
    navigate,
    dialogOpen,
    setDialogOpen,
    shop,
    isLoading,
    products,
    refetchProducts,
  };
}

import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";

export function useProductListPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shopIdNum = id ? parseInt(id, 10) : 0;

  const { data: shop, isLoading: shopLoading } = trpc.shop.get.useQuery(
    { shopId: shopIdNum },
    { enabled: shopIdNum > 0 },
  );

  const { data: products, isLoading: productsLoading } =
    trpc.product.list.useQuery(
      { shopId: shopIdNum },
      { enabled: shopIdNum > 0 },
    );

  return {
    t,
    navigate,
    shopIdNum,
    shop,
    shopLoading,
    products,
    productsLoading,
  };
}

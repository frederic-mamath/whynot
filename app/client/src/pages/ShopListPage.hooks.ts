import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";

export function useShopListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: shops, isLoading } = trpc.shop.list.useQuery();

  return {
    t,
    navigate,
    shops,
    isLoading,
  };
}

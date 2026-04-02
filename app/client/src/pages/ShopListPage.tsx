import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import { Plus, Store, Users } from "lucide-react";
import Container from "../components/Container";
import { useShopListPage } from "./ShopListPage.hooks";

export default function ShopListPage() {
  const { t, navigate, shops, isLoading } = useShopListPage();

  if (isLoading) {
    return (
      <Container className="py-8">
        <p>{t("shops.list.loading")}</p>
      </Container>
    );
  }

  return (
    <Container className="py-8" size="lg">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("shops.list.title")}</h1>
          <p className="text-muted-foreground">{t("shops.list.subtitle")}</p>
        </div>
        <ButtonV2
          icon={<Plus className="size-4" />}
          label={t("shops.list.createShop")}
          onClick={() => navigate("/shops/create")}
          className="bg-primary text-primary-foreground"
        />
      </div>

      {!shops || shops.length === 0 ? (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {t("shops.list.noShops")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("shops.list.noShopsDesc")}
          </p>
          <ButtonV2
            icon={<Plus className="size-4" />}
            label={t("shops.list.createShop")}
            onClick={() => navigate("/shops/create")}
            className="bg-primary text-primary-foreground"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              to={`/shops/${shop.id}`}
              className="block p-6 bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Store className="h-5 w-5 text-primary mr-2" />
                  <h3 className="text-xl font-semibold">{shop.name}</h3>
                </div>
                {shop.role === "shop-owner" && (
                  <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
                    {t("shops.list.owner")}
                  </span>
                )}
                {shop.role === "vendor" && (
                  <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded">
                    {t("shops.list.vendor")}
                  </span>
                )}
              </div>
              {shop.description && (
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {shop.description}
                </p>
              )}
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {t("shops.list.vendors", { count: shop.vendor_count || 0 })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

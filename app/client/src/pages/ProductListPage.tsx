import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ArrowLeft, Package } from "lucide-react";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import Placeholder from "../components/ui/Placeholder/Placeholder";
import ProductCard from "../components/ProductCard";
import Container from "../components/Container";
import { useProductListPage } from "./ProductListPage.hooks";

export default function ProductListPage() {
  const {
    t,
    navigate,
    shopIdNum,
    shop,
    shopLoading,
    products,
    productsLoading,
  } = useProductListPage();

  if (shopLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{t("products.list.loading")}</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{t("products.list.notFound")}</p>
          <ButtonV2
            className="mt-4 bg-primary text-primary-foreground"
            onClick={() => navigate("/shops")}
            label={t("products.list.backToShops")}
          />
        </div>
      </div>
    );
  }

  return (
    <Container className="py-8" size="lg">
      {/* Header */}
      <div className="mb-8">
        <ButtonV2
          icon={<ArrowLeft className="size-4" />}
          label={t("products.list.backToShop")}
          onClick={() => navigate(`/shops/${shopIdNum}`)}
          className="bg-transparent text-foreground mb-4"
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("products.list.title")}
            </h1>
            <p className="text-muted-foreground mt-1">{shop.name}</p>
          </div>

          <ButtonV2
            icon={<Plus className="size-4" />}
            label={t("products.list.createProduct")}
            onClick={() => navigate(`/shops/${shopIdNum}/products/create`)}
            className="bg-primary text-primary-foreground"
          />
        </div>
      </div>

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/shops/${shopIdNum}/products/${product.id}/edit`}
            >
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      ) : (
        <Placeholder
          Icon={<Package className="size-20" />}
          title={t("products.list.noProducts")}
          ButtonListProps={[{
            icon: <Plus className="size-4" />,
            label: t("products.list.createProduct"),
            onClick: () => navigate(`/shops/${shopIdNum}/products/create`),
            className: "bg-primary text-primary-foreground",
          }]}
        />
      )}
    </Container>
  );
}

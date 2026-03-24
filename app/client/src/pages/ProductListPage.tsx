import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ArrowLeft, Package } from "lucide-react";
import { trpc } from "../lib/trpc";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import ProductCard from "../components/ProductCard";
import Container from "../components/Container";

export default function ProductListPage() {
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
        <div className="text-center py-16">
          <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t("products.list.noProducts")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("products.list.noProductsDesc")}
          </p>
          <ButtonV2
            icon={<Plus className="size-4" />}
            label={t("products.list.createProduct")}
            onClick={() => navigate(`/shops/${shopIdNum}/products/create`)}
            className="bg-primary text-primary-foreground"
          />
        </div>
      )}
    </Container>
  );
}

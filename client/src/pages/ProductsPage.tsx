import { useParams, Link } from "react-router-dom";
import { Plus, ArrowLeft, Package } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import ProductCard from "../components/ProductCard";

export default function ProductsPage() {
  const { id } = useParams<{ id: string }>();
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
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Shop not found</p>
          <Button className="mt-4" asChild>
            <Link to="/shops">Back to Shops</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="mb-4" asChild>
            <Link to={`/shops/${shopIdNum}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">{shop.name}</p>
            </div>

            <Button asChild>
              <Link to={`/shops/${shopIdNum}/products/create`}>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Link>
            </Button>
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No products yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first product to get started
            </p>
            <Button asChild>
              <Link to={`/shops/${shopIdNum}/products/create`}>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

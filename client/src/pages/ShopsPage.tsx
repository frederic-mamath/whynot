import { Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Plus, Store, Users } from 'lucide-react';

export default function ShopsPage() {
  const { data: shops, isLoading } = trpc.shop.list.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading shops...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Shops</h1>
          <p className="text-gray-600">Manage your shops and vendors</p>
        </div>
        <Link to="/shops/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Shop
          </Button>
        </Link>
      </div>

      {!shops || shops.length === 0 ? (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shops yet</h3>
          <p className="text-gray-500 mb-6">Create your first shop to get started</p>
          <Link to="/shops/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Shop
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              to={`/shops/${shop.id}`}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Store className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-xl font-semibold">{shop.name}</h3>
                </div>
                {shop.role === 'shop-owner' && (
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                    Owner
                  </span>
                )}
                {shop.role === 'vendor' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Vendor
                  </span>
                )}
              </div>
              {shop.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{shop.description}</p>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                <span>{shop.vendor_count || 0} vendors</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

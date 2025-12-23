import { Package } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    description: string | null;
    price: string | null;
    imageUrl: string | null;
    isActive: boolean;
    shopName?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = product.price
    ? `$${parseFloat(product.price).toFixed(2)}`
    : 'Price not set';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex items-center justify-center w-full h-full">
                  <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              `;
            }}
          />
        ) : (
          <Package className="w-16 h-16 text-gray-400" />
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-indigo-600">
            {formattedPrice}
          </span>
          {product.shopName && (
            <span className="text-xs text-gray-500">{product.shopName}</span>
          )}
        </div>
      </div>
    </div>
  );
}

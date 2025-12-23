import { trpc } from '../../lib/trpc';
import { Button } from '../ui/button';
import { Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VendorListProps {
  shopId: number;
  isOwner: boolean;
}

export default function VendorList({ shopId, isOwner }: VendorListProps) {
  const { data: vendors, isLoading } = trpc.shop.listVendors.useQuery({ id: shopId });
  const utils = trpc.useUtils();

  const removeVendorMutation = trpc.shop.removeVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor removed successfully');
      utils.shop.listVendors.invalidate({ id: shopId });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove vendor');
    },
  });

  const handleRemove = (userId: number, userEmail: string) => {
    if (window.confirm(`Are you sure you want to remove ${userEmail} as a vendor?`)) {
      removeVendorMutation.mutate({
        shopId,
        userId,
      });
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">Loading vendors...</p>;
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-gray-500">No vendors yet</p>
        {isOwner && (
          <p className="text-sm text-gray-400 mt-2">Add vendors to help manage this shop</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vendors.map((vendor) => (
        <div
          key={vendor.user_id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div>
            <p className="font-medium">{vendor.email}</p>
            <p className="text-sm text-gray-500">
              Added on {new Date(vendor.created_at).toLocaleDateString()}
            </p>
          </div>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemove(vendor.user_id, vendor.email)}
              disabled={removeVendorMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { trpc } from '../../lib/trpc';
import { Button } from '../ui/button';
import { Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VendorListProps {
  shopId: number;
  isOwner: boolean;
}

export default function VendorList({ shopId, isOwner }: VendorListProps) {
  const { t } = useTranslation();
  const { data: vendors, isLoading } = trpc.shop.listVendors.useQuery({ shopId });
  const utils = trpc.useUtils();

  const removeVendorMutation = trpc.shop.removeVendor.useMutation({
    onSuccess: () => {
      toast.success(t('vendors.successRemove'));
      utils.shop.listVendors.invalidate({ shopId });
    },
    onError: (error) => {
      toast.error(error.message || t('vendors.errorRemove'));
    },
  });

  const handleRemove = (userId: number, displayName: string) => {
    if (window.confirm(t('vendors.removeConfirm', { name: displayName }))) {
      removeVendorMutation.mutate({
        shopId,
        userId,
      });
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">{t('vendors.loading')}</p>;
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-gray-500">{t('vendors.noVendors')}</p>
        {isOwner && (
          <p className="text-sm text-gray-400 mt-2">{t('vendors.addVendorsHint')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vendors.map((vendor) => {
        const displayName = vendor.firstname && vendor.lastname
          ? `${vendor.firstname} ${vendor.lastname}`
          : vendor.firstname || vendor.lastname || vendor.email;
        
        return (
          <div
            key={vendor.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-gray-500">
                {t('vendors.addedOn', { date: new Date(vendor.assigned_at).toLocaleDateString() })}
              </p>
            </div>
            {isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(vendor.id, displayName)}
                disabled={removeVendorMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

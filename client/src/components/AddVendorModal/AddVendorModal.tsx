import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface AddVendorModalProps {
  shopId: number;
  onClose: () => void;
}

export default function AddVendorModal({ shopId, onClose }: AddVendorModalProps) {
  const [userId, setUserId] = useState('');
  const utils = trpc.useUtils();

  const addVendorMutation = trpc.shop.addVendor.useMutation({
    onSuccess: () => {
      toast.success('Vendor added successfully');
      utils.shop.listVendors.invalidate({ id: shopId });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add vendor');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const id = parseInt(userId);
    if (isNaN(id) || id <= 0) {
      toast.error('Please enter a valid user ID');
      return;
    }

    addVendorMutation.mutate({
      shopId,
      userId: id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Vendor</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID *</Label>
            <Input
              id="userId"
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
              min="1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the ID of the user you want to add as a vendor
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={addVendorMutation.isPending}
              className="flex-1"
            >
              {addVendorMutation.isPending ? 'Adding...' : 'Add Vendor'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateShopPage() {
  const navigate = useNavigate(); // Keep for form success redirect
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createShopMutation = trpc.shop.create.useMutation({
    onSuccess: (shop) => {
      toast.success('Shop created successfully!');
      navigate(`/shop/${shop.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create shop');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    createShopMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link to="/shops">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shops
        </Link>
      </Button>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h1 className="text-3xl font-bold mb-2">Create New Shop</h1>
        <p className="text-gray-600 mb-8">Set up your shop and start managing products</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Shop Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter shop name"
              required
              maxLength={255}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your shop (optional)"
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createShopMutation.isPending}
              className="flex-1"
            >
              {createShopMutation.isPending ? 'Creating...' : 'Create Shop'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/shops">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

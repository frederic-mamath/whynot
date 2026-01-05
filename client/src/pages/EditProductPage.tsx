import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Trash2, Link as LinkIcon } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import Container from '../components/Container';
import AssociateProductModal from '../components/AssociateProductModal';

export default function EditProductPage() {
  const { id, productId } = useParams<{ id: string; productId: string }>();
  const navigate = useNavigate();
  const shopIdNum = id ? parseInt(id, 10) : 0;
  const productIdNum = productId ? parseInt(productId, 10) : 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showAssociateModal, setShowAssociateModal] = useState(false);

  const { data: product, isLoading } = trpc.product.get.useQuery(
    { productId: productIdNum },
    { enabled: productIdNum > 0 }
  );

  const { data: shop } = trpc.shop.get.useQuery(
    { shopId: shopIdNum },
    { enabled: shopIdNum > 0 }
  );

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setPrice(product.price ? parseFloat(product.price).toString() : '');
      setImageUrl(product.imageUrl || '');
      setIsActive(product.isActive);
    }
  }, [product]);

  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully!');
      navigate(`/shops/${shopIdNum}/products`);
    },
    onError: (error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully!');
      navigate(`/shops/${shopIdNum}/products`);
    },
    onError: (error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    updateProduct.mutate({
      productId: productIdNum,
      name: name.trim(),
      description: description.trim() || null,
      price: price ? parseFloat(price) : null,
      imageUrl: imageUrl.trim() || null,
      isActive,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate({ productId: productIdNum });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!product || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="md">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to={`/shops/${shopIdNum}/products`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="bg-card rounded-lg border border-border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
                <p className="text-sm text-muted-foreground">{shop.name}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                maxLength={255}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={4}
                maxLength={1000}
              />
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <div className="mt-3 aspect-square max-w-xs bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <p class="text-sm text-red-500">Invalid image URL</p>
                      `;
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="isActive">Status</Label>
              <Button
                type="button"
                variant={isActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? 'Active' : 'Inactive'}
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/shops/${shopIdNum}/products`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </div>

        {/* Channel Associations Section */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Channel Associations</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Associate this product with channels to make it available for promotion
          </p>
          <Button variant="outline" onClick={() => setShowAssociateModal(true)}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Manage Associations
          </Button>
        </div>
      </Container>

      {showAssociateModal && (
        <AssociateProductModal
          productId={productIdNum}
          shopId={shopIdNum}
          onClose={() => setShowAssociateModal(false)}
        />
      )}
    </div>
  );
}

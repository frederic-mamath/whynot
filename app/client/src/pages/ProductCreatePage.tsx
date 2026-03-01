import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Container from "../components/Container";
import {
  ImageUploader,
  ProductImageItem,
} from "../components/ui/ImageUploader";

export default function ProductCreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shopIdNum = id ? parseInt(id, 10) : 0;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<ProductImageItem[]>([]);

  const { data: shop } = trpc.shop.get.useQuery(
    { shopId: shopIdNum },
    { enabled: shopIdNum > 0 },
  );

  const createProduct = trpc.product.create.useMutation({
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const addImageMutation = trpc.product.addImage.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    try {
      const product = await createProduct.mutateAsync({
        shopId: shopIdNum,
        name: name.trim(),
        description: description.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        imageUrl: images.length > 0 ? images[0].url : null,
      });

      // Save all images to product_images table
      for (let i = 0; i < images.length; i++) {
        await addImageMutation.mutateAsync({
          productId: product.id,
          url: images[i].url,
          cloudinaryPublicId: images[i].cloudinaryPublicId ?? null,
        });
      }

      toast.success("Product created successfully!");
      navigate(`/shops/${shopIdNum}/products`);
    } catch (error: any) {
      toast.error(`Failed to create product: ${error.message}`);
    }
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Shop not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <Container size="md">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to={`/shops/${shopIdNum}/products`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create Product
              </h1>
              <p className="text-sm text-muted-foreground">{shop.name}</p>
            </div>
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

            <ImageUploader images={images} onImagesChange={setImages} />

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createProduct.isPending || addImageMutation.isPending}
              >
                {createProduct.isPending || addImageMutation.isPending
                  ? "Creating..."
                  : "Create Product"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/shops/${shopIdNum}/products`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}

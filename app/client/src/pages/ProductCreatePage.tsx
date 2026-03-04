import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.error(t("products.create.errorCreate", { message: error.message }));
    },
  });

  const addImageMutation = trpc.product.addImage.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("products.create.errorNameRequired"));
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

      toast.success(t("products.create.successCreate"));
      navigate(`/shops/${shopIdNum}/products`);
    } catch (error: any) {
      toast.error(
        t("products.create.errorCreate", { message: (error as any).message }),
      );
    }
  };

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{t("products.create.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <Container size="md">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to={`/shops/${shopIdNum}/products`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("products.create.backToProducts")}
          </Link>
        </Button>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("products.create.title")}
              </h1>
              <p className="text-sm text-muted-foreground">{shop.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">{t("products.create.nameLabel")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("products.create.namePlaceholder")}
                maxLength={255}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t("products.create.descLabel")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("products.create.descPlaceholder")}
                rows={4}
                maxLength={1000}
              />
            </div>

            <div>
              <Label htmlFor="price">{t("products.create.priceLabel")}</Label>
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
                  ? t("products.create.creating")
                  : t("products.create.submit")}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/shops/${shopIdNum}/products`}>
                  {t("products.create.cancel")}
                </Link>
              </Button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}

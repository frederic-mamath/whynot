import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Package, Trash2, Link as LinkIcon } from "lucide-react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import Container from "../components/Container";
import AssociateProductModal from "../components/AssociateProductModal";
import {
  ImageUploader,
  ProductImageItem,
} from "../components/ui/ImageUploader";

export default function ProductUpdatePage() {
  const { t } = useTranslation();
  const { id, productId } = useParams<{ id: string; productId: string }>();
  const navigate = useNavigate();
  const shopIdNum = id ? parseInt(id, 10) : 0;
  const productIdNum = productId ? parseInt(productId, 10) : 0;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [initialImageIds, setInitialImageIds] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [showAssociateModal, setShowAssociateModal] = useState(false);

  const { data: product, isLoading } = trpc.product.get.useQuery(
    { productId: productIdNum },
    { enabled: productIdNum > 0 },
  );

  const { data: shop } = trpc.shop.get.useQuery(
    { shopId: shopIdNum },
    { enabled: shopIdNum > 0 },
  );

  const { data: existingImages } = trpc.product.listImages.useQuery(
    { productId: productIdNum },
    { enabled: productIdNum > 0 },
  );

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price ? parseFloat(product.price).toString() : "");
      setIsActive(product.isActive);
    }
  }, [product]);

  // Load existing images into the state
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setImages(
        existingImages.map((img) => ({
          id: img.id,
          url: img.url,
          cloudinaryPublicId: img.cloudinaryPublicId,
          isNew: false,
        })),
      );
      setInitialImageIds(existingImages.map((img) => img.id));
    } else if (
      product?.imageUrl &&
      (!existingImages || existingImages.length === 0)
    ) {
      // Fallback: use the legacy imageUrl field if no product_images exist
      setImages([
        { url: product.imageUrl, cloudinaryPublicId: null, isNew: false },
      ]);
      setInitialImageIds([]);
    }
  }, [existingImages, product]);

  const updateProduct = trpc.product.update.useMutation({
    onError: (error) => {
      toast.error(t("products.update.errorUpdate", { message: error.message }));
    },
  });

  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => {
      toast.success(t("products.update.successDelete"));
      navigate(`/shops/${shopIdNum}/products`);
    },
    onError: (error) => {
      toast.error(t("products.update.errorDelete", { message: error.message }));
    },
  });

  const addImageMutation = trpc.product.addImage.useMutation();
  const removeImageMutation = trpc.product.removeImage.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("products.update.errorNameRequired"));
      return;
    }

    try {
      await updateProduct.mutateAsync({
        productId: productIdNum,
        name: name.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        imageUrl: images.length > 0 ? images[0].url : null,
        isActive,
      });

      // Remove deleted images
      const currentIds = images.filter((img) => img.id).map((img) => img.id!);
      const removedIds = initialImageIds.filter(
        (id) => !currentIds.includes(id),
      );
      for (const id of removedIds) {
        await removeImageMutation.mutateAsync({ imageId: id });
      }

      // Add new images
      const newImages = images.filter((img) => img.isNew);
      for (const img of newImages) {
        await addImageMutation.mutateAsync({
          productId: productIdNum,
          url: img.url,
          cloudinaryPublicId: img.cloudinaryPublicId ?? null,
        });
      }

      toast.success(t("products.update.successUpdate"));
      navigate(`/shops/${shopIdNum}/products`);
    } catch (error: any) {
      toast.error(
        t("products.update.errorUpdate", { message: (error as any).message }),
      );
    }
  };

  const handleDelete = () => {
    if (confirm(t("products.update.deleteConfirm"))) {
      deleteProduct.mutate({ productId: productIdNum });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t("products.update.loading")}</p>
      </div>
    );
  }

  if (!product || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{t("products.update.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <Container size="md">
        <Button variant="ghost" className="mb-6" asChild>
          <Link to={`/shops/${shopIdNum}/products`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("products.update.backToProducts")}
          </Link>
        </Button>

        <div className="bg-card rounded-lg border border-border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Edit Product
                </h1>
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
              {t("products.update.delete")}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">{t("products.update.nameLabel")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("products.update.namePlaceholder")}
                maxLength={255}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t("products.update.descLabel")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("products.update.descPlaceholder")}
                rows={4}
                maxLength={1000}
              />
            </div>

            <div>
              <Label htmlFor="price">{t("products.update.priceLabel")}</Label>
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

            <div className="flex items-center gap-3">
              <Label htmlFor="isActive">
                {t("products.update.statusLabel")}
              </Label>
              <Button
                type="button"
                variant={isActive ? "default" : "secondary"}
                size="sm"
                onClick={() => setIsActive(!isActive)}
              >
                {isActive
                  ? t("products.update.active")
                  : t("products.update.inactive")}
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={
                  updateProduct.isPending ||
                  addImageMutation.isPending ||
                  removeImageMutation.isPending
                }
              >
                {updateProduct.isPending ||
                addImageMutation.isPending ||
                removeImageMutation.isPending
                  ? t("products.update.saving")
                  : t("products.update.submit")}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={`/shops/${shopIdNum}/products`}>
                  {t("products.update.cancel")}
                </Link>
              </Button>
            </div>
          </form>
        </div>

        {/* Channel Associations Section */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-foreground" />
            <h2 className="text-xl font-semibold text-foreground">
              {t("products.update.channelAssociations")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("products.update.channelAssociationsDesc")}
          </p>
          <Button variant="outline" onClick={() => setShowAssociateModal(true)}>
            <LinkIcon className="w-4 h-4 mr-2" />
            {t("products.update.manageAssociations")}
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

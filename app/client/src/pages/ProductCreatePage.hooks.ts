import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { type ProductImageItem } from "../components/ui/ImageUploader";

export function useProductCreatePage() {
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

  return {
    t,
    navigate,
    shopIdNum,
    name,
    setName,
    description,
    setDescription,
    price,
    setPrice,
    images,
    setImages,
    shop,
    createProduct,
    addImageMutation,
    handleSubmit,
  };
}

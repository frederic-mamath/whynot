import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ImageUploader,
  ProductImageItem,
} from "../../components/ui/ImageUploader";
import { Label } from "../../components/ui/label";
import ButtonV2 from "../../components/ui/ButtonV2/ButtonV2";
import Input from "@/components/ui/Input/Input";

interface ProductFormProps {
  shopId: number;
  onSuccess: () => void;
}

export default function ProductForm({ shopId, onSuccess }: ProductFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [wishedPrice, setWishedPrice] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [conditionId, setConditionId] = useState<number | null>(null);
  const [images, setImages] = useState<ProductImageItem[]>([]);

  const { data: categories } = trpc.catalog.listCategories.useQuery();
  const { data: conditions } = trpc.catalog.listConditions.useQuery();

  const createProduct = trpc.product.create.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addImageMutation = trpc.product.addImage.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom du produit est requis");
      return;
    }

    try {
      const product = await createProduct.mutateAsync({
        shopId,
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: images.length > 0 ? images[0].url : null,
        startingPrice: startingPrice ? parseFloat(startingPrice) : undefined,
        wishedPrice: wishedPrice ? parseFloat(wishedPrice) : undefined,
        categoryId: categoryId ?? undefined,
        conditionId: conditionId ?? undefined,
      });

      for (let i = 0; i < images.length; i++) {
        await addImageMutation.mutateAsync({
          productId: product.id,
          url: images[i].url,
          cloudinaryPublicId: images[i].cloudinaryPublicId ?? null,
        });
      }

      toast.success("Produit créé !");
      onSuccess();
    } catch {
      // Error handled by mutation onError
    }
  };

  const isPending = createProduct.isPending || addImageMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Images */}
      <Input
        type="image"
        label="Photo du produit"
        value={images.length > 0 ? images[0].url : ""}
        onChange={(value) => {
          if (value) {
            setImages([{ url: value, cloudinaryPublicId: null }]);
          } else {
            setImages([]);
          }
        }}
      />

      {/* Name */}
      <Input
        type="text"
        onChange={(value) => setName(value)}
        label="Nom du produit"
        placeholder="Ex: Air Jordan 1 Retro High"
      />

      {/* Description */}
      <Input
        type="textarea"
        rows={4}
        onChange={(value) => setDescription(value)}
        label="Description"
        placeholder="Décris ton produit..."
      />

      {/* Category chips */}
      <div>
        <div className={cn("text-muted-foreground text-[11px] font-semibold")}>
          Catégorie
        </div>
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {categories.map((cat) => (
              <ButtonV2
                key={`ProductForm-Category-${cat.id}`}
                className={cn(
                  "py-2 px-3",
                  "border-divider border-[2px] border-solid rounded-[10px]",
                  "bg-b-fourth",
                  "text-muted",
                  categoryId === cat.id && "border-primary text-primary",
                )}
                label={cat.name}
                icon={cat.emoji}
                onClick={() =>
                  setCategoryId(categoryId === cat.id ? null : cat.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Condition chips */}
      <div>
        <div className={cn("text-muted-foreground text-[11px] font-semibold")}>
          État
        </div>
        {conditions && conditions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {conditions.map((cond) => (
              <ButtonV2
                key={`ProductForm-Condition-${cond.id}`}
                type="button"
                onClick={() =>
                  setConditionId(conditionId === cond.id ? null : cond.id)
                }
                className={cn(
                  "py-2 px-3",
                  "border-divider border-[2px] border-solid rounded-[10px]",
                  "bg-b-fourth",
                  "text-muted",
                  conditionId === cond.id && "border-primary text-primary",
                )}
                label={cond.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          label="Prix de départ"
          placeholder="20€"
          onChange={(value) => setStartingPrice(value)}
        />
        <Input
          type="number"
          label="Prix souhaité"
          placeholder="45€"
          onChange={(value) => setWishedPrice(value)}
        />
      </div>

      {/* Submit */}
      <ButtonV2
        type="submit"
        label={isPending ? "Création..." : "Créer le produit"}
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground font-bold"
      />
    </form>
  );
}

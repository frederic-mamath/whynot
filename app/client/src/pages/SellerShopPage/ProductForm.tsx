import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ImageUploader,
  ProductImageItem,
} from "../../components/ui/ImageUploader";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import ButtonV2 from "../../components/ui/ButtonV2/ButtonV2";

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
      <ImageUploader images={images} onImagesChange={setImages} />

      {/* Name */}
      <div>
        <Label htmlFor="product-name">Nom du produit</Label>
        <Input
          id="product-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Air Jordan 1 Retro High"
          maxLength={255}
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="product-desc">Description</Label>
        <Textarea
          id="product-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décris ton produit..."
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* Category chips */}
      {categories && categories.length > 0 && (
        <div>
          <Label>Catégorie</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  setCategoryId(categoryId === cat.id ? null : cat.id)
                }
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-outfit transition-colors",
                  categoryId === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition chips */}
      {conditions && conditions.length > 0 && (
        <div>
          <Label>État</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {conditions.map((cond) => (
              <button
                key={cond.id}
                type="button"
                onClick={() =>
                  setConditionId(conditionId === cond.id ? null : cond.id)
                }
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-outfit transition-colors",
                  conditionId === cond.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {cond.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="starting-price">Prix de départ (€)</Label>
          <Input
            id="starting-price"
            type="number"
            step="0.01"
            min="0"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="wished-price">Prix souhaité (€)</Label>
          <Input
            id="wished-price"
            type="number"
            step="0.01"
            min="0"
            value={wishedPrice}
            onChange={(e) => setWishedPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
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

import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { Label } from "../label";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface ProductImageItem {
  id?: number;
  url: string;
  cloudinaryPublicId?: string | null;
  isNew?: boolean; // true for images not yet saved to product_images
}

interface ImageUploaderProps {
  images: ProductImageItem[];
  onImagesChange: (images: ProductImageItem[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.image.upload.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Max 7MB before base64 encoding
    if (file.size > 7 * 1024 * 1024) {
      toast.error("Image too large (max 7MB)");
      return;
    }

    setIsUploading(true);

    try {
      const base64 = await fileToBase64(file);

      const result = await uploadMutation.mutateAsync({ base64 });

      const newImage: ProductImageItem = {
        url: result.url,
        cloudinaryPublicId: result.publicId,
        isNew: true,
      };

      onImagesChange([...images, newImage]);
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset the input that triggered this change
      const input = e.target as HTMLInputElement;
      input.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <Label>Product Images</Label>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
            >
              <img
                src={img.url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "";
                  e.currentTarget.className = "hidden";
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="size-3.5" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded text-xs font-medium">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add image controls */}
      {canAddMore && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <label
            className={cn(
              "w-full h-20 border-2 border-dashed rounded-md flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
              isUploading && "pointer-events-none opacity-60",
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Uploading…
                </span>
              </>
            ) : (
              <>
                <Plus className="size-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Ajouter une photo
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          <p className="text-xs text-muted-foreground">
            {images.length} / {maxImages} images
          </p>
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

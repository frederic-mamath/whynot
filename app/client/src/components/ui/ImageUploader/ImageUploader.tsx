import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Link as LinkIcon,
  X,
  Loader2,
  Images,
  FolderOpen,
  SwitchCamera,
  Plus,
} from "lucide-react";
import { Button } from "../button";
import { Input } from "../input";
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

type TabMode = "capture" | "url";
type CaptureSource = "gallery" | "back" | "front" | "file";

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("capture");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", onOutsideClick);
    }
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [dropdownOpen]);

  function triggerInput(source: CaptureSource) {
    setDropdownOpen(false);
    const map: Record<
      CaptureSource,
      React.RefObject<HTMLInputElement | null>
    > = {
      gallery: galleryInputRef,
      back: backCameraInputRef,
      front: frontCameraInputRef,
      file: fileInputRef,
    };
    map[source].current?.click();
  }

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
      // Reset all file inputs so the same file can be selected again
      [
        galleryInputRef,
        backCameraInputRef,
        frontCameraInputRef,
        fileInputRef,
      ].forEach((ref) => {
        if (ref.current) ref.current.value = "";
      });
    }
  };

  const handleUrlAdd = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed); // validate
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    const newImage: ProductImageItem = {
      url: trimmed,
      cloudinaryPublicId: null,
      isNew: true,
    };

    onImagesChange([...images, newImage]);
    setUrlInput("");
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
          {/* Tab buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={activeTab === "capture" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("capture")}
            >
              <Camera className="size-4 mr-1.5" />
              Photo
            </Button>
            <Button
              type="button"
              variant={activeTab === "url" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("url")}
            >
              <LinkIcon className="size-4 mr-1.5" />
              URL
            </Button>
          </div>

          {/* Tab content */}
          {activeTab === "capture" ? (
            <div className="space-y-2">
              {/* Hidden inputs — one per source */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={backCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={frontCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Single trigger + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full h-20 border-2 border-dashed flex items-center justify-center gap-2",
                    isUploading && "pointer-events-none opacity-60",
                  )}
                  onClick={() => setDropdownOpen((v) => !v)}
                  disabled={isUploading}
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
                </Button>

                {dropdownOpen && (
                  <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {(
                      [
                        {
                          source: "gallery" as CaptureSource,
                          icon: Images,
                          label: "Photo Library",
                        },
                        {
                          source: "back" as CaptureSource,
                          icon: Camera,
                          label: "Take Photo",
                        },
                        {
                          source: "front" as CaptureSource,
                          icon: SwitchCamera,
                          label: "Front Camera",
                        },
                        {
                          source: "file" as CaptureSource,
                          icon: FolderOpen,
                          label: "Choose File",
                        },
                      ] as const
                    ).map(({ source, icon: Icon, label }, i, arr) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => triggerInput(source)}
                        className={cn(
                          "w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-muted transition-colors",
                          i < arr.length - 1 && "border-b border-border",
                        )}
                      >
                        <span>{label}</span>
                        <Icon className="size-5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlAdd();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUrlAdd}
                disabled={!urlInput.trim()}
              >
                Add
              </Button>
            </div>
          )}

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

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus } from "lucide-react";
import { trpc } from "../../lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";
import ProductListSection from "@/components/ProductListSection";

interface Props {
  open: boolean;
  onClose: () => void;
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ScheduleLiveDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState("20:00");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts } = trpc.product.list.useQuery(
    { shopId: myShop?.id ?? 0 },
    { enabled: !!myShop?.id },
  );

  const associateMutation = trpc.product.associateToChannel.useMutation();
  const imageUploadMutation = trpc.image.upload.useMutation();

  const scheduleMutation = trpc.live.schedule.useMutation({
    onSuccess: async (data) => {
      const liveId = data.live.id;
      await Promise.all(
        selectedProductIds.map((productId) =>
          associateMutation.mutateAsync({ productId, channelId: liveId }),
        ),
      );
      utils.live.listByHost.invalidate();
      setSelectedProductIds([]);
      setName("");
      setDescription("");
      setDate(todayDate());
      setTime("20:00");
      setEndTime("");
      setCoverPreview(null);
      setSelectedCoverFile(null);
      setFormError("");
      onClose();
    },
    onError: (err) => setFormError(err.message),
  });

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || name.length < 3) {
      setFormError("Le nom doit contenir au moins 3 caractères.");
      return;
    }
    const startsAt = new Date(`${date}T${time}:00`).toISOString();
    const endsAt = endTime
      ? new Date(`${date}T${endTime}:00`).toISOString()
      : undefined;

    const doSchedule = (coverUrl?: string) => {
      scheduleMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        startsAt,
        endsAt,
        coverUrl,
      });
    };

    if (selectedCoverFile) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const { url } = await imageUploadMutation.mutateAsync({ base64 });
          doSchedule(url);
        } catch {
          doSchedule(undefined);
        }
      };
      reader.readAsDataURL(selectedCoverFile);
    } else {
      doSchedule(undefined);
    }
  }

  function toggleProductId(id: number) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="font-syne font-bold">
            Programmer un live
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSchedule} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="live-name"
              className="font-syne font-bold text-foreground"
            >
              Titre du live
            </Label>
            <Input
              type="text"
              placeholder="Ex : Drop vintage #4 — Pièces rares 🔥"
              value={name}
              onChange={(v) => setName(v)}
              required
              borderClassName="bg-b-fourth border-0 rounded-2xl px-5 py-4 has-[input:focus]:ring-0"
              inputClassName="font-outfit text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Date & time */}
          <div className="flex flex-col gap-2">
            <Label className="font-syne font-bold text-foreground">
              Date et heure
            </Label>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-syne">
                Date du live
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-b-fourth border-0 rounded-2xl px-5 py-4 font-syne font-bold text-foreground text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-syne">
                  Début
                </span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full bg-b-fourth border-0 rounded-2xl px-5 py-4 font-syne font-bold text-foreground text-sm"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-syne">
                  Fin (optionnel)
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-b-fourth border-0 rounded-2xl px-5 py-4 font-syne font-bold text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="live-desc"
              className="font-syne font-bold text-foreground"
            >
              Description (optionnel)
            </Label>
            <Textarea
              id="live-desc"
              placeholder="Décris ce que tu vas présenter..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none bg-b-fourth border-0 rounded-2xl px-5 py-4 font-outfit text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-2">
            <Label className="font-syne font-bold text-foreground">
              Photo de couverture
            </Label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedCoverFile(file);
                const reader = new FileReader();
                reader.onload = (ev) =>
                  setCoverPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
            {coverPreview ? (
              <div className="relative rounded-2xl overflow-hidden h-40 w-full">
                <img
                  src={coverPreview}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-outfit"
                  onClick={() => {
                    setCoverPreview(null);
                    setSelectedCoverFile(null);
                  }}
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-b-fourth rounded-2xl h-28 text-muted-foreground text-sm font-outfit hover:text-primary transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                Ajouter une photo de couverture
              </button>
            )}
          </div>

          {/* Products */}
          <div className="flex flex-col gap-3">
            <ProductListSection
              products={shopProducts ?? []}
              selectedProductIds={selectedProductIds}
              onToggleProduct={toggleProductId}
              onSetSelectedProducts={setSelectedProductIds}
              shopExists={!!myShop}
              onNavigateToShop={() => navigate("/seller/shop")}
              onNavigateToCreateProduct={() =>
                navigate("/seller/shop/products/create")
              }
            />
          </div>

          {formError && (
            <p className="text-destructive text-sm font-outfit">{formError}</p>
          )}

          <ButtonV2
            type="submit"
            label={
              scheduleMutation.isPending || imageUploadMutation.isPending
                ? "Programmation…"
                : "Programmer ce live"
            }
            className="bg-primary text-primary-foreground mt-1"
            disabled={
              scheduleMutation.isPending || imageUploadMutation.isPending
            }
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

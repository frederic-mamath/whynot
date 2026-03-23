import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio,
  Play,
  Calendar,
  Clock,
  ChevronRight,
  Pencil,
  ImagePlus,
} from "lucide-react";
import ProductListSection from "@/components/ProductListSection";
import { trpc } from "../lib/trpc";
import Tabs from "@/components/ui/Tabs";
import ButtonV2 from "@/components/ui/ButtonV2";
import Input from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function toLocalDateStr(d: Date | string | null | undefined): string {
  if (!d) return todayDate();
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = (dt.getMonth() + 1).toString().padStart(2, "0");
  const day = dt.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTimeStr(d: Date | string | null | undefined): string {
  if (!d) return "20:00";
  const dt = new Date(d);
  return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SellerLivePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("programme");

  // Schedule form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState("20:00");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editingLive, setEditingLive] = useState<{
    id: number;
    name: string;
    description: string | null;
    starts_at: Date | string;
    ends_at: Date | string | null;
    cover_url?: string | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState(todayDate());
  const [editTime, setEditTime] = useState("20:00");
  const [editEndTime, setEditEndTime] = useState("");
  const [editProductIds, setEditProductIds] = useState<number[]>([]);
  const [editError, setEditError] = useState("");
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [selectedEditCoverFile, setSelectedEditCoverFile] =
    useState<File | null>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const editEndTimeInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = trpc.live.listByHost.useQuery(
    undefined,
    { refetchOnWindowFocus: false },
  );

  // Shop + products for the seller
  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const shopId = myShop?.id;
  const { data: shopProducts } = trpc.product.list.useQuery(
    { shopId: shopId ?? 0 },
    { enabled: shopId !== undefined },
  );

  // Products already linked to the live being edited
  const { data: linkedProducts } = trpc.product.listByChannel.useQuery(
    { channelId: editingLive?.id ?? 0 },
    { enabled: editingLive !== null },
  );

  // Sync edit dialog form when a live is selected
  useEffect(() => {
    if (editingLive) {
      setEditName(editingLive.name);
      setEditDescription(editingLive.description ?? "");
      setEditDate(toLocalDateStr(editingLive.starts_at));
      setEditTime(toLocalTimeStr(editingLive.starts_at));
      setEditEndTime(
        editingLive.ends_at ? toLocalTimeStr(editingLive.ends_at) : "",
      );
      setEditError("");
      setEditCoverPreview(editingLive.cover_url ?? null);
      setSelectedEditCoverFile(null);
    }
  }, [editingLive]);

  // Pre-tick linked products when they load
  useEffect(() => {
    if (linkedProducts) {
      setEditProductIds(linkedProducts.map((p) => p.id));
    }
  }, [linkedProducts]);

  const associateMutation = trpc.product.associateToChannel.useMutation();
  const removeMutation = trpc.product.removeFromChannel.useMutation();
  const updateLiveMutation = trpc.live.update.useMutation();
  const imageUploadMutation = trpc.image.upload.useMutation();

  const scheduleMutation = trpc.live.schedule.useMutation({
    onSuccess: async (data) => {
      const liveId = data.live.id;
      await Promise.all(
        selectedProductIds.map((productId) =>
          associateMutation.mutateAsync({ productId, channelId: liveId }),
        ),
      );
      setSelectedProductIds([]);
      setFormSuccess(true);
      setName("");
      setDescription("");
      setDate(todayDate());
      setTime("20:00");
      setEndTime("");
      setCoverPreview(null);
      setSelectedCoverFile(null);
      setFormError("");
      refetch();
      setTimeout(() => {
        setActiveTab("programme");
        setFormSuccess(false);
      }, 1200);
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

  async function handleEditSave() {
    if (!editingLive) return;
    setEditError("");
    if (!editName.trim() || editName.length < 3) {
      setEditError("Le nom doit contenir au moins 3 caractères.");
      return;
    }

    const doUpdate = async (coverUrl?: string | null) => {
      await updateLiveMutation.mutateAsync({
        liveId: editingLive.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
        startsAt: new Date(`${editDate}T${editTime}:00`).toISOString(),
        endsAt: editEndTime
          ? new Date(`${editDate}T${editEndTime}:00`).toISOString()
          : null,
        coverUrl,
      });

      // Diff products
      const currentIds = new Set(linkedProducts?.map((p) => p.id) ?? []);
      const newIds = new Set(editProductIds);
      const toAdd = editProductIds.filter((id) => !currentIds.has(id));
      const toRemove = (linkedProducts ?? [])
        .filter((p) => !newIds.has(p.id))
        .map((p) => p.id);

      await Promise.all([
        ...toAdd.map((productId) =>
          associateMutation.mutateAsync({
            productId,
            channelId: editingLive.id,
          }),
        ),
        ...toRemove.map((productId) =>
          removeMutation.mutateAsync({
            productId,
            channelId: editingLive.id,
          }),
        ),
      ]);

      refetch();
      setEditingLive(null);
      setSelectedEditCoverFile(null);
      setEditCoverPreview(null);
    };

    try {
      if (selectedEditCoverFile) {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target?.result as string;
          try {
            const { url } = await imageUploadMutation.mutateAsync({ base64 });
            await doUpdate(url);
          } catch {
            await doUpdate(undefined);
          }
        };
        reader.readAsDataURL(selectedEditCoverFile);
      } else {
        await doUpdate(undefined);
      }
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : "Une erreur est survenue.",
      );
    }
  }

  function toggleProductId(
    id: number,
    current: number[],
    setter: (ids: number[]) => void,
  ) {
    if (current.includes(id)) {
      setter(current.filter((pid) => pid !== id));
    } else {
      setter([...current, id]);
    }
  }

  const tabs = [
    { id: "programme", label: "Programme" },
    { id: "new", label: "+ Live" },
  ];

  return (
    <div className="flex flex-col pb-4">
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-syne font-extrabold text-xl text-foreground mb-4">
          Lives
        </h1>
        <Tabs
          selectedTabId={activeTab}
          items={tabs}
          onClickItem={setActiveTab}
        />
      </div>

      {activeTab === "programme" && (
        <div className="flex flex-col gap-6 px-4 pt-4">
          {/* À venir */}
          <section>
            <h2 className="font-syne font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              À venir
            </h2>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (data?.upcoming ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Calendar className="w-8 h-8" />
                <p className="text-sm">Aucun live programmé</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(data?.upcoming ?? []).map((live) => (
                  <Card className={cn("bg-b-fourth")} key={live.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex flex-col gap-0.5 min-w-0 flex-1 cursor-pointer"
                          onClick={() => setEditingLive(live)}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-syne font-bold text-sm text-foreground truncate">
                              {live.name}
                            </span>
                            <Pencil className="w-3 h-3 text-muted-foreground shrink-0" />
                          </div>
                          <span className="text-xs text-muted-foreground font-outfit flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTime(live.starts_at)}
                          </span>
                          {live.description && (
                            <span className="text-xs text-muted-foreground font-outfit mt-1 line-clamp-2">
                              {live.description}
                            </span>
                          )}
                        </div>
                        <ButtonV2
                          icon={<Play className="w-3 h-3" />}
                          label="Démarrer"
                          className="bg-primary text-primary-foreground shrink-0 text-xs px-3"
                          onClick={() => navigate(`/live/${live.id}`)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Passés */}
          <section>
            <h2 className="font-syne font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Passés
            </h2>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (data?.past ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Radio className="w-8 h-8" />
                <p className="text-sm">Aucun live passé</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(data?.past ?? []).map((live) => (
                  <Card key={live.id} className={cn("bg-b-fourth")}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-syne font-bold text-sm text-foreground truncate">
                            {live.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-outfit flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTime(live.starts_at)}
                          </span>
                        </div>
                        <span className="text-xs font-outfit text-muted-foreground shrink-0 flex items-center gap-1">
                          {live.ended_at !== null ||
                          (live.ends_at !== null &&
                            new Date(live.ends_at) <= new Date()) ? (
                            "Terminé"
                          ) : (
                            <span className="text-primary font-bold">
                              En cours
                            </span>
                          )}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "new" && (
        <form
          onSubmit={handleSchedule}
          className="flex flex-col gap-6 px-4 pt-4"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="live-name"
              className="font-syne font-bold text-foreground text-base"
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

          {/* Date & time — pill buttons */}
          <div className="flex flex-col gap-2">
            <Label className="font-syne font-bold text-foreground text-base">
              Date et heure
            </Label>
            <div className="flex gap-3">
              {/* Hidden real inputs */}
              <input
                type="date"
                ref={dateInputRef}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="sr-only"
                required
              />
              <input
                type="time"
                ref={timeInputRef}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="sr-only"
                required
              />
              <button
                type="button"
                onClick={() =>
                  dateInputRef.current?.showPicker?.() ??
                  dateInputRef.current?.click()
                }
                className="flex-1 flex items-center justify-center gap-2 bg-b-fourth rounded-2xl px-5 py-4 font-syne font-bold text-foreground text-sm"
              >
                📅{" "}
                {date === todayDate()
                  ? "Ce soir"
                  : new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
              </button>
              <button
                type="button"
                onClick={() =>
                  timeInputRef.current?.showPicker?.() ??
                  timeInputRef.current?.click()
                }
                className="flex-1 flex items-center justify-center gap-2 bg-b-fourth rounded-2xl px-5 py-4 font-syne font-bold text-foreground text-sm"
              >
                🕐 {time.replace(":", "h")}
              </button>
            </div>
            {/* End time row */}
            <div className="flex gap-3">
              <input
                type="time"
                ref={endTimeInputRef}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() =>
                  endTimeInputRef.current?.showPicker?.() ??
                  endTimeInputRef.current?.click()
                }
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 bg-b-fourth rounded-2xl px-5 py-3 font-syne font-bold text-sm",
                  endTime ? "text-foreground" : "text-muted-foreground",
                )}
              >
                🏁{" "}
                {endTime
                  ? `Fin : ${endTime.replace(":", "h")}`
                  : "+ Heure de fin (optionnel)"}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="live-desc"
              className="font-syne font-bold text-foreground text-base"
            >
              Description (optionnel)
            </Label>
            <Textarea
              id="live-desc"
              placeholder="Décris ce que tu vas présenter..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none bg-b-fourth border-0 rounded-2xl px-5 py-4 font-outfit text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-2">
            <Label className="font-syne font-bold text-foreground text-base">
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

          {/* Products section */}
          <div className="flex flex-col gap-3">
            <ProductListSection
              products={shopProducts ?? []}
              selectedProductIds={selectedProductIds}
              onToggleProduct={(id) =>
                toggleProductId(id, selectedProductIds, setSelectedProductIds)
              }
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

          {formSuccess && (
            <p className="text-primary text-sm font-outfit font-bold">
              Live programmé !
            </p>
          )}

          <ButtonV2
            type="submit"
            label={
              scheduleMutation.isPending || imageUploadMutation.isPending
                ? "Programmation…"
                : "Programmer ce live"
            }
            className="bg-primary text-primary-foreground mt-2"
            disabled={
              scheduleMutation.isPending || imageUploadMutation.isPending
            }
          />
        </form>
      )}

      {/* Edit live dialog */}
      <Dialog
        open={editingLive !== null}
        onOpenChange={(open) => {
          if (!open) setEditingLive(null);
        }}
      >
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-syne font-bold">
              Modifier le live
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nom *</Label>
              <Input
                type="text"
                value={editName}
                onChange={(v) => setEditName(v)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Cover image */}
            <div className="flex flex-col gap-1.5">
              <Label>Photo de couverture</Label>
              <input
                ref={editCoverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSelectedEditCoverFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) =>
                    setEditCoverPreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }}
              />
              {editCoverPreview ? (
                <div className="relative rounded-xl overflow-hidden h-28 w-full">
                  <img
                    src={editCoverPreview}
                    alt="cover"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-outfit"
                    onClick={() => {
                      setEditCoverPreview(null);
                      setSelectedEditCoverFile(null);
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => editCoverInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 border border-dashed border-border rounded-xl h-20 text-muted-foreground text-sm font-outfit hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                  Ajouter une photo de couverture
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(v) => setEditDate(v)}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label>Heure de début</Label>
                <Input
                  type="time"
                  value={editTime}
                  onChange={(v) => setEditTime(v)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-end-time">Heure de fin (optionnel)</Label>
              <input
                ref={editEndTimeInputRef}
                id="edit-end-time"
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Products section in dialog */}
            <div className="flex flex-col gap-2">
              <ProductListSection
                products={shopProducts ?? []}
                selectedProductIds={editProductIds}
                onToggleProduct={(id) =>
                  toggleProductId(id, editProductIds, setEditProductIds)
                }
                onSetSelectedProducts={setEditProductIds}
                shopExists={!!myShop}
                onNavigateToShop={() => navigate("/seller/shop")}
                onNavigateToCreateProduct={() =>
                  navigate("/seller/shop/products/create")
                }
              />
            </div>

            {editError && (
              <p className="text-destructive text-sm font-outfit">
                {editError}
              </p>
            )}
          </div>

          <DialogFooter>
            <ButtonV2
              type="button"
              label={
                updateLiveMutation.isPending ? "Enregistrement…" : "Enregistrer"
              }
              className="bg-primary text-primary-foreground w-full"
              disabled={
                updateLiveMutation.isPending ||
                associateMutation.isPending ||
                removeMutation.isPending
              }
              onClick={handleEditSave}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

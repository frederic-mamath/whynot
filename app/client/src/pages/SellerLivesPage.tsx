import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio,
  Play,
  Calendar,
  Clock,
  ChevronRight,
  ShoppingBag,
  Pencil,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import Tabs from "@/components/ui/Tabs";
import ButtonV2 from "@/components/ui/ButtonV2";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Edit dialog state
  const [editingLive, setEditingLive] = useState<{
    id: number;
    name: string;
    description: string | null;
    starts_at: Date | string;
    ends_at: Date | string | null;
  } | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState(todayDate());
  const [editTime, setEditTime] = useState("20:00");
  const [editProductIds, setEditProductIds] = useState<number[]>([]);
  const [editError, setEditError] = useState("");

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
      setEditError("");
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
      setFormError("");
      refetch();
      setTimeout(() => {
        setActiveTab("programme");
        setFormSuccess(false);
      }, 1200);
    },
    onError: (err) => setFormError(err.message),
  });

  const startMutation = trpc.live.start.useMutation({
    onSuccess: (data) => {
      navigate(`/live/${data.live?.id}`);
    },
    onError: (err) => alert(err.message),
  });

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || name.length < 3) {
      setFormError("Le nom doit contenir au moins 3 caractères.");
      return;
    }
    const startsAt = new Date(`${date}T${time}:00`).toISOString();
    scheduleMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      startsAt,
    });
  }

  async function handleEditSave() {
    if (!editingLive) return;
    setEditError("");
    if (!editName.trim() || editName.length < 3) {
      setEditError("Le nom doit contenir au moins 3 caractères.");
      return;
    }
    try {
      await updateLiveMutation.mutateAsync({
        liveId: editingLive.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
        startsAt: new Date(`${editDate}T${editTime}:00`).toISOString(),
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
    <div className="flex flex-col min-h-screen pb-4">
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
                          disabled={startMutation.isPending}
                          onClick={() =>
                            startMutation.mutate({ liveId: live.id })
                          }
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
                          {live.status === "active" ? (
                            <span className="text-primary font-bold">
                              En cours
                            </span>
                          ) : (
                            "Terminé"
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
          className="flex flex-col gap-4 px-4 pt-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="live-name">Nom du live *</Label>
            <Input
              id="live-name"
              type="text"
              placeholder="Mon live du soir"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="live-desc">Description</Label>
            <Textarea
              id="live-desc"
              placeholder="Au programme ce soir…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="live-date">Date</Label>
              <Input
                id="live-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="live-time">Heure</Label>
              <Input
                id="live-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Products section */}
          <div className="flex flex-col gap-2">
            <h3 className="font-syne font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Produits associés
            </h3>
            {!myShop ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
                <ShoppingBag className="w-7 h-7" />
                <p className="text-sm">
                  Crée ta boutique avant d'associer des produits.
                </p>
                <ButtonV2
                  type="button"
                  label="Créer ma boutique"
                  className="text-xs"
                  onClick={() => navigate("/seller/shop")}
                />
              </div>
            ) : !shopProducts || shopProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
                <ShoppingBag className="w-7 h-7" />
                <p className="text-sm">
                  Ajoute des produits à ta boutique pour les lier à ce live.
                </p>
                <ButtonV2
                  type="button"
                  label="Créer un produit"
                  className="text-xs"
                  onClick={() => navigate("/seller/shop/products/create")}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {shopProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border bg-b-fourth cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={() =>
                        toggleProductId(
                          product.id,
                          selectedProductIds,
                          setSelectedProductIds,
                        )
                      }
                    />
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-outfit font-medium text-foreground truncate">
                        {product.name}
                      </span>
                      {product.startingPrice != null && (
                        <span className="text-xs text-muted-foreground font-outfit">
                          {product.startingPrice.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
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
              scheduleMutation.isPending
                ? "Programmation…"
                : "Programmer ce live"
            }
            className="bg-primary text-primary-foreground mt-2"
            disabled={scheduleMutation.isPending}
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
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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

            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="edit-time">Heure</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>

            {/* Products section in dialog */}
            <div className="flex flex-col gap-2">
              <h3 className="font-syne font-bold text-sm text-muted-foreground uppercase tracking-wider">
                Produits associés
              </h3>
              {!shopProducts || shopProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground font-outfit">
                  Aucun produit dans ta boutique.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {shopProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border bg-b-fourth cursor-pointer"
                    >
                      <Checkbox
                        checked={editProductIds.includes(product.id)}
                        onCheckedChange={() =>
                          toggleProductId(
                            product.id,
                            editProductIds,
                            setEditProductIds,
                          )
                        }
                      />
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      )}
                      <span className="text-sm font-outfit font-medium text-foreground truncate">
                        {product.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
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

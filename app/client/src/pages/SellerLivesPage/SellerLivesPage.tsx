import { Plus, Calendar, Radio, ImagePlus } from "lucide-react";
import Placeholder from "@/components/ui/Placeholder/Placeholder";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSellerLives } from "./SellerLivesPage.hooks";
import LiveCard from "./LiveCard";
import ScheduleLiveDialog from "./ScheduleLiveDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";
import ProductListSection from "@/components/ProductListSection";

export default function SellerLivesPage() {
  const {
    upcoming,
    past,
    isLoading,
    navigate,
    createOpen,
    setCreateOpen,
    deleteId,
    setDeleteId,
    deleteMutation,
    editingLive,
    setEditingLive,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    editEndTime,
    setEditEndTime,
    editError,
    editCoverPreview,
    setEditCoverPreview,
    selectedEditCoverFile,
    setSelectedEditCoverFile,
    editCoverInputRef,
    editEndTimeInputRef,
    editProductIds,
    setEditProductIds,
    myShop,
    shopProducts,
    updateLiveMutation,
    associateMutation,
    removeMutation,
    handleEditSave,
    toggleEditProductId,
  } = useSellerLives();

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className={cn("flex items-center gap-3", "mb-2")}>
        <button
          onClick={() => navigate("/seller")}
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-syne font-extrabold text-2xl text-foreground">
          Lives
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted mb-5 leading-relaxed">
        Préparez vos lives, gérez votre programme et consultez vos sessions
        passées
      </p>

      {/* CTA */}
      <button
        onClick={() => setCreateOpen(true)}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "border border-border rounded-2xl py-3",
          "text-sm font-outfit font-medium text-foreground",
          "hover:border-primary/50 hover:text-primary transition-colors",
          "mb-6",
        )}
      >
        <Plus className="w-4 h-4" />
        programmer un nouveau live
      </button>

      {/* A venir */}
      <h2 className="font-syne font-bold text-base text-foreground mb-3">
        À venir
      </h2>
      {isLoading ? (
        <p className="text-muted-foreground text-sm font-outfit mb-6">
          Chargement…
        </p>
      ) : upcoming.length === 0 ? (
        <div className="mb-6">
          <Placeholder Icon={<Calendar className="size-8" />} title="Aucun live programmé" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {upcoming.map((live) => (
            <LiveCard
              key={live.id}
              id={live.id}
              name={live.name}
              description={live.description}
              coverUrl={live.cover_url}
              startsAt={live.starts_at}
              categoryNames={live.categoryNames}
              isPast={false}
              onEdit={() => setEditingLive(live)}
              onDelete={() => setDeleteId(live.id)}
            />
          ))}
        </div>
      )}

      {/* Passés */}
      <h2 className="font-syne font-bold text-base text-foreground mb-3">
        Passés
      </h2>
      {isLoading ? (
        <p className="text-muted-foreground text-sm font-outfit">
          Chargement…
        </p>
      ) : past.length === 0 ? (
        <Placeholder Icon={<Radio className="size-8" />} title="Aucun live passé" />
      ) : (
        <div className="flex flex-col gap-3">
          {past.map((live) => (
            <LiveCard
              key={live.id}
              id={live.id}
              name={live.name}
              description={live.description}
              coverUrl={live.cover_url}
              startsAt={live.starts_at}
              categoryNames={live.categoryNames}
              isPast={true}
              onEdit={() => setEditingLive(live)}
            />
          ))}
        </div>
      )}

      {/* Schedule dialog */}
      <ScheduleLiveDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-syne font-bold">
              Supprimer ce live ?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-outfit">
              Cette action est irréversible. Le live sera définitivement
              supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-outfit">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground font-outfit"
              onClick={() =>
                deleteId !== null &&
                deleteMutation.mutate({ liveId: deleteId })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog
        open={editingLive !== null}
        onOpenChange={(open) => {
          if (!open) setEditingLive(null);
        }}
      >
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
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

            <div className="flex flex-col gap-2">
              <ProductListSection
                products={shopProducts ?? []}
                selectedProductIds={editProductIds}
                onToggleProduct={toggleEditProductId}
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
                updateLiveMutation.isPending
                  ? "Enregistrement…"
                  : "Enregistrer"
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

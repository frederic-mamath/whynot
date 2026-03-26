import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

interface Props {
  id: number;
  name: string;
  description?: string | null;
  pictureUrl?: string | null;
}

const ShopProductItem = ({ id, name, description, pictureUrl }: Props) => {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast.success("Produit supprimé");
      setDeleteOpen(false);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Image */}
        <div
          className={cn(
            "w-full h-40 bg-muted flex items-center justify-center",
          )}
        >
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col gap-1">
          <p className="font-outfit font-semibold text-sm text-foreground">
            {name}
          </p>
          {description && (
            <p className="text-xs text-muted line-clamp-2">{description}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() =>
                navigate(`/seller/shop/products/${id}/edit`)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-xs font-outfit hover:border-primary/50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Modifier
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-destructive text-xs font-outfit hover:border-destructive/50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement
              supprimé de votre boutique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ productId: id })}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ShopProductItem;

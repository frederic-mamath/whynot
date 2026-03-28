import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { trpc } from "../../lib/trpc";

function toLocalDateStr(d: Date | string): string {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalTimeStr(d: Date | string): string {
  const date = new Date(d);
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

type LiveWithCategories = {
  id: number;
  name: string;
  description: string | null;
  cover_url: string | null;
  starts_at: Date;
  ends_at: Date | null;
  ended_at: Date | null;
  categoryNames: string[];
  [key: string]: unknown;
};

export function useSellerLives() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.live.listByHost.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const upcoming = (data?.upcoming ?? []) as LiveWithCategories[];
  const past = (data?.past ?? []) as LiveWithCategories[];

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deleteMutation = trpc.live.delete.useMutation({
    onSuccess: () => {
      utils.live.listByHost.invalidate();
      toast.success("Live supprimé");
      setDeleteId(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  // Edit state
  const [editingLive, setEditingLive] = useState<LiveWithCategories | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editError, setEditError] = useState("");
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [selectedEditCoverFile, setSelectedEditCoverFile] =
    useState<File | null>(null);
  const [editProductIds, setEditProductIds] = useState<number[]>([]);
  const editCoverInputRef = useRef<HTMLInputElement>(null);
  const editEndTimeInputRef = useRef<HTMLInputElement>(null);

  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts } = trpc.product.list.useQuery(
    { shopId: myShop?.id ?? 0 },
    { enabled: !!myShop?.id },
  );
  const { data: linkedProducts } = trpc.product.listByChannel.useQuery(
    { channelId: editingLive?.id ?? 0 },
    { enabled: !!editingLive?.id },
  );

  const associateMutation = trpc.product.associateToChannel.useMutation();
  const removeMutation = trpc.product.removeFromChannel.useMutation();
  const updateLiveMutation = trpc.live.update.useMutation();
  const imageUploadMutation = trpc.image.upload.useMutation();

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

  useEffect(() => {
    if (linkedProducts) {
      setEditProductIds(linkedProducts.map((p) => p.id));
    }
  }, [linkedProducts]);

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

      utils.live.listByHost.invalidate();
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

  function toggleEditProductId(id: number) {
    setEditProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  }

  return {
    upcoming,
    past,
    isLoading,
    navigate,
    // Create
    createOpen,
    setCreateOpen,
    // Delete
    deleteId,
    setDeleteId,
    deleteMutation,
    // Edit
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
  };
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { trpc } from "../../lib/trpc";
import { PackageItem } from "./PackageCard";

export function useSellerDeliveries() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [labelDialogPackageId, setLabelDialogPackageId] = useState<
    string | null
  >(null);
  const [weightInput, setWeightInput] = useState("");
  const [weightError, setWeightError] = useState("");

  const { data, isLoading } = trpc.package.getPackagesForSeller.useQuery();

  const generateLabel = trpc.package.generateLabel.useMutation({
    onSuccess: ({ trackingNumber, labelUrl }) => {
      utils.package.getPackagesForSeller.invalidate();
      setLabelDialogPackageId(null);
      setWeightInput("");
      setWeightError("");
      toast.success(`Étiquette créée — n° ${trackingNumber}`);
      if (labelUrl) {
        window.open(labelUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const refreshStatus = trpc.package.refreshStatus.useMutation({
    onSuccess: ({ status }) => {
      utils.package.getPackagesForSeller.invalidate();
      const labels: Record<string, string> = {
        shipped: "En transit",
        delivered: "Livré",
        incident: "Incident signalé",
      };
      toast.success(`Statut mis à jour : ${labels[status] ?? status}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const requestPayouts = trpc.package.requestPayouts.useMutation({
    onSuccess: ({ createdCount }) => {
      utils.package.getPackagesForSeller.invalidate();
      toast.success(
        `${createdCount} demande${createdCount !== 1 ? "s" : ""} de paiement créée${createdCount !== 1 ? "s" : ""}`,
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = (data?.pending ?? []) as PackageItem[];
  const shipped = (data?.shipped ?? []) as PackageItem[];

  function filterPackages(packages: PackageItem[]): PackageItem[] {
    if (!search.trim()) return packages;
    const q = search.toLowerCase();
    return packages.filter(
      (p) =>
        p.buyerName.toLowerCase().includes(q) ||
        p.orders.some((o) => o.id.toLowerCase().includes(q)),
    );
  }

  function handleGenerateLabel() {
    const w = parseInt(weightInput, 10);
    if (!w || w < 1) {
      setWeightError("Entrez un poids valide en grammes (ex: 500)");
      return;
    }
    setWeightError("");
    generateLabel.mutate({
      packageId: labelDialogPackageId!,
      weightGrams: w,
    });
  }

  return {
    isLoading,
    navigate,
    search,
    setSearch,
    pending: filterPackages(pending),
    shipped: filterPackages(shipped),
    // Label dialog
    labelDialogPackageId,
    setLabelDialogPackageId,
    weightInput,
    setWeightInput,
    weightError,
    handleGenerateLabel,
    generateLabel,
    // Mutations
    refreshStatus,
    requestPayouts,
  };
}

import { ChevronLeft, Truck, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/Input/Input";
import { useSellerDeliveries } from "./SellerDeliveriesPage.hooks";
import PackageCard, { PackageItem } from "./PackageCard";
import GenerateLabelDialog from "./GenerateLabelDialog";
import Placeholder from "@/components/ui/Placeholder/Placeholder";

export default function SellerDeliveriesPage() {
  const {
    isLoading,
    navigate,
    search,
    setSearch,
    pending,
    shipped,
    labelDialogPackageId,
    setLabelDialogPackageId,
    weightInput,
    setWeightInput,
    weightError,
    handleGenerateLabel,
    generateLabel,
    refreshStatus,
    requestPayouts,
  } = useSellerDeliveries();

  return (
    <div className="pt-6 pb-24">
      {/* Header */}
      <div className={cn("flex items-center gap-3", "mb-2")}>
        <button
          onClick={() => navigate("/seller")}
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-syne font-extrabold text-2xl text-foreground">
          Livraisons
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted mb-5 leading-relaxed">
        Livrez vos clients en temps et en heure pour améliorer votre réputation
        et être mis en avant plus régulièrement
      </p>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Rechercher par acheteur ou n° de commande"
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* En attente d'expédition */}
      <h2 className="font-syne font-bold text-base text-foreground mb-3">
        En attente d'expédition
        {pending.length > 0 && (
          <span className="ml-2 text-sm font-outfit font-normal text-muted-foreground">
            ({pending.length})
          </span>
        )}
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground font-outfit mb-6">
          Chargement…
        </p>
      ) : pending.length === 0 ? (
        <div className="mb-6">
          <Placeholder Icon={<Package className="size-8" />} title="Aucune commande en attente d'expédition" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {pending.map((pkg: PackageItem) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onGenerateLabel={() => setLabelDialogPackageId(pkg.id)}
              onRefreshStatus={() =>
                refreshStatus.mutate({ packageId: pkg.id })
              }
              isRefreshing={refreshStatus.isPending}
            />
          ))}
        </div>
      )}

      {/* Expédiés */}
      <h2 className="font-syne font-bold text-base text-foreground mb-3">
        Expédiés
        {shipped.length > 0 && (
          <span className="ml-2 text-sm font-outfit font-normal text-muted-foreground">
            ({shipped.length})
          </span>
        )}
      </h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground font-outfit">
          Chargement…
        </p>
      ) : shipped.length === 0 ? (
        <Placeholder Icon={<Truck className="size-8" />} title="Aucun colis expédié" />
      ) : (
        <div className="flex flex-col gap-3">
          {shipped.map((pkg: PackageItem) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              onRefreshStatus={() =>
                refreshStatus.mutate({ packageId: pkg.id })
              }
              onRequestPayouts={() =>
                requestPayouts.mutate({ packageId: pkg.id })
              }
              isRefreshing={refreshStatus.isPending}
            />
          ))}
        </div>
      )}

      {/* Generate Label Dialog */}
      <GenerateLabelDialog
        open={!!labelDialogPackageId}
        onOpenChange={(v) => {
          if (!v) setLabelDialogPackageId(null);
        }}
        weightInput={weightInput}
        onWeightChange={setWeightInput}
        weightError={weightError}
        onSubmit={handleGenerateLabel}
        isPending={generateLabel.isPending}
      />
    </div>
  );
}

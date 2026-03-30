import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import ButtonV2 from "@/components/ui/ButtonV2";

export type PackageStatus =
  | "pending"
  | "label_generated"
  | "shipped"
  | "delivered"
  | "incident";

export interface PackageOrder {
  id: string;
  productName: string;
  productImageUrl: string | null;
  finalPrice: number;
  paidAt: string | null;
  createdAt: string;
}

export interface PackageItem {
  id: string;
  status: PackageStatus;
  trackingNumber: string | null;
  labelUrl: string | null;
  weightGrams: number | null;
  deliveredAt: string | null;
  createdAt: string;
  hasBuyerRelayPoint: boolean;
  buyerName: string;
  liveName: string;
  liveCoverUrl: string | null;
  liveStartsAt: string;
  orders: PackageOrder[];
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: PackageStatus }) {
  const config: Record<PackageStatus, { label: string; className: string }> = {
    pending: {
      label: "En attente",
      className: "bg-muted text-muted-foreground",
    },
    label_generated: {
      label: "Étiquette créée",
      className: "bg-primary/20 text-primary",
    },
    shipped: { label: "Expédié", className: "bg-blue-500/20 text-blue-600" },
    delivered: {
      label: "Livré",
      className: "bg-green-500/20 text-green-600",
    },
    incident: {
      label: "Incident",
      className: "bg-destructive/20 text-destructive",
    },
  };
  const { label, className } = config[status];
  return (
    <span
      className={cn(
        "text-xs font-outfit font-medium px-2 py-0.5 rounded-full shrink-0",
        className,
      )}
    >
      {label}
    </span>
  );
}

interface Props {
  package: PackageItem;
  onGenerateLabel?: () => void;
  onRefreshStatus: () => void;
  onRequestPayouts?: () => void;
  isRefreshing: boolean;
}

export default function PackageCard({
  package: pkg,
  onGenerateLabel,
  onRefreshStatus,
  onRequestPayouts,
  isRefreshing,
}: Props) {
  const firstPaidAt = pkg.orders
    .map((o) => o.paidAt)
    .filter(Boolean)
    .sort()[0];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Live cover image */}
      <div className="h-28 relative">
        {pkg.liveCoverUrl ? (
          <img
            src={pkg.liveCoverUrl}
            alt={pkg.liveName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Buyer name + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-outfit font-semibold text-sm text-foreground truncate">
              {pkg.buyerName}
            </p>
            <p className="text-xs text-muted-foreground font-outfit truncate">
              {pkg.liveName}
            </p>
          </div>
          <StatusBadge status={pkg.status} />
        </div>

        {/* Products + timeline */}
        <div className="flex gap-4">
          {/* Product list */}
          <ul className="flex-1 space-y-1 min-w-0">
            {pkg.orders.map((o) => (
              <li
                key={o.id}
                className="text-xs text-muted-foreground font-outfit truncate"
              >
                — {o.productName}
              </li>
            ))}
          </ul>

          {/* Timeline */}
          <div className="shrink-0 space-y-1 text-right">
            <p className="text-xs font-outfit text-muted-foreground">
              📅 {formatDate(firstPaidAt)}
            </p>
            <p className="text-xs font-outfit text-muted-foreground">
              📦{" "}
              {pkg.status === "label_generated" ||
              pkg.status === "shipped" ||
              pkg.status === "delivered"
                ? formatDate(firstPaidAt)
                : "—"}
            </p>
            <p className="text-xs font-outfit text-muted-foreground">
              ✅ {pkg.deliveredAt ? formatDate(pkg.deliveredAt) : "—"}
            </p>
          </div>
        </div>

        {/* Tracking number */}
        {pkg.trackingNumber && (
          <p className="text-xs text-muted-foreground font-outfit">
            Suivi :{" "}
            <span className="font-mono text-foreground">
              {pkg.trackingNumber}
            </span>
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {onGenerateLabel &&
            (pkg.status === "pending" || pkg.status === "label_generated") && (
              <ButtonV2
                label="Générer le label"
                onClick={onGenerateLabel}
                disabled={!pkg.hasBuyerRelayPoint}
                title={
                  !pkg.hasBuyerRelayPoint
                    ? "L'acheteur n'a pas encore choisi un point relais"
                    : undefined
                }
                className={cn(
                  "flex-1",
                  pkg.hasBuyerRelayPoint
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 border border-border bg-background text-muted-foreground cursor-not-allowed",
                )}
              />
            )}

          {pkg.trackingNumber && (
            <ButtonV2
              label={isRefreshing ? "…" : "Rafraîchir l'état"}
              onClick={onRefreshStatus}
              disabled={isRefreshing}
              className="border border-border bg-background text-foreground"
            />
          )}

          {onRequestPayouts &&
            (pkg.status === "shipped" || pkg.status === "delivered") && (
              <ButtonV2
                label="Demander le paiement"
                onClick={onRequestPayouts}
                className="flex-1 border border-border bg-background text-foreground"
              />
            )}
        </div>
      </div>
    </div>
  );
}

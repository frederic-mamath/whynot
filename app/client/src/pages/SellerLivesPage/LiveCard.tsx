import { Video, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  id: number;
  name: string;
  description: string | null;
  coverUrl: string | null;
  startsAt: Date | string;
  categoryNames: string[];
  isPast: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveCard({
  name,
  description,
  coverUrl,
  startsAt,
  categoryNames,
  isPast,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Image area */}
      <div className="h-40 relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Video className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <span
          className={cn(
            "absolute top-2 left-2 text-xs font-outfit font-medium px-2 py-0.5 rounded-full",
            isPast
              ? "bg-muted text-muted-foreground"
              : "bg-primary/20 text-primary",
          )}
        >
          {isPast ? "Terminé" : "À venir"}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <p className="font-outfit font-semibold text-sm text-foreground">
            {name}
          </p>
          <span className="text-xs border border-border rounded-lg px-2 py-1 shrink-0 font-outfit text-muted-foreground">
            {formatDateTime(startsAt)}
          </span>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground font-outfit line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-wrap gap-1">
            {categoryNames.map((cat) => (
              <span
                key={cat}
                className="text-xs border border-border rounded-full px-2 py-0.5 font-outfit text-muted-foreground"
              >
                {cat}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-xs font-outfit text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Modifier
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs font-outfit text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Radio, Wifi, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  liveStatus: "upcoming" | "active" | "ended" | null;
  joined: boolean;
  error: string | null;
  liveMeta: {
    startsAt: string | null;
  } | null;
}

const LivePlaceholders = ({ liveStatus, joined, error, liveMeta }: Props) => {
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm w-full">
          <WifiOff className="size-16 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Erreur de connexion</h2>
          <p className="text-destructive text-sm">{error}</p>
          <Link
            to="/home"
            className="text-primary text-sm font-outfit hover:underline block"
          >
            ← Retour à la page d'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!joined) {
    if (liveStatus === "upcoming") {
      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Radio className="size-16 mx-auto text-primary/60" />
            <h2 className="text-xl font-semibold text-foreground">
              Ce live n'a pas encore commencé
            </h2>
            {liveMeta?.startsAt && (
              <p className="text-muted-foreground">
                Début prévu le{" "}
                {new Date(liveMeta.startsAt).toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              La page se rafraîchira automatiquement…
            </p>
          </div>
        </div>
      );
    }

    if (liveStatus === "ended") {
      return (
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center space-y-4">
            <WifiOff className="size-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">
              Ce live est terminé
            </h2>
            <Link
              to="/home"
              className="text-primary text-sm font-outfit hover:underline"
            >
              ← Retour à la page d'accueil
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wifi className="size-16 mx-auto text-primary animate-pulse" />
          <h2 className="text-xl font-semibold">Connexion au live…</h2>
        </div>
      </div>
    );
  }
};

export default LivePlaceholders;

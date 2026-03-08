import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft, Check } from "lucide-react";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";
import { trpc } from "../../lib/trpc";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [view, setView] = useState<"form" | "success" | "error">("form");

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setView("success"),
    onError: () => setView("error"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    resetMutation.mutate({ token, password });
  };

  if (view === "success") {
    return (
      <div className="min-h-screen px-6 py-10 flex flex-col">
        <Link
          to="/login"
          className="text-muted flex gap-2 items-center mb-3 font-semibold"
        >
          <ArrowLeft size={16} />
          <div className="text-[12px]">Retour</div>
        </Link>

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500 flex items-center justify-center mb-2">
            <Check className="text-emerald-500" size={28} />
          </div>
          <div className="font-syne text-foreground text-[22px] font-extrabold leading-[26px] text-center">
            Mot de passe modifié !
          </div>
          <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] text-center max-w-[280px]">
            Ton mot de passe a été réinitialisé. Tu peux maintenant te
            connecter.
          </div>
          <ButtonV2
            className="bg-primary text-txt-primary font-semibold w-full mt-4"
            label="Se connecter"
            onClick={() => navigate("/login")}
          />
        </div>
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="min-h-screen px-6 py-10 flex flex-col">
        <Link
          to="/login"
          className="text-muted flex gap-2 items-center mb-3 font-semibold"
        >
          <ArrowLeft size={16} />
          <div className="text-[12px]">Retour</div>
        </Link>

        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="font-syne text-foreground text-[22px] font-extrabold leading-[26px] text-center">
            Lien expiré ou invalide
          </div>
          <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] text-center max-w-[280px]">
            Ce lien de réinitialisation n'est plus valide. Demande un nouveau
            lien.
          </div>
          <ButtonV2
            className="bg-primary text-primary-foreground font-semibold w-full mt-4"
            label="Demander un nouveau lien"
            onClick={() => navigate("/forgot-password")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 flex flex-col">
      <Link
        to="/login"
        className="text-muted flex gap-2 items-center mb-3 font-semibold"
      >
        <ArrowLeft size={16} />
        <div className="text-[12px]">Retour</div>
      </Link>
      <div className="font-syne text-foreground text-[22px] font-extrabold leading-[26px] mb-1">
        Nouveau mot de passe
      </div>
      <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] mb-6">
        Choisis un nouveau mot de passe pour ton compte.
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          icon={<Lock />}
          label="Nouveau mot de passe"
          type="password"
          placeholder="••••••••"
          onChange={(value) => setPassword(value)}
        />
        <Input
          icon={<Lock />}
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••••"
          onChange={(value) => setConfirm(value)}
        />
        {error && (
          <div className="text-destructive text-[12px] font-semibold">
            {error}
          </div>
        )}
        <ButtonV2
          className="bg-primary text-primary-foreground font-semibold w-full"
          label="Réinitialiser"
          type="submit"
          disabled={resetMutation.isPending}
        />
      </form>
    </div>
  );
}

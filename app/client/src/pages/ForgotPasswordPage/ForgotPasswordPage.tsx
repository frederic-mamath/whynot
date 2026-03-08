import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Check } from "lucide-react";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";
import { trpc } from "../../lib/trpc";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [view, setView] = useState<"form" | "success">("form");

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setView("success"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    forgotMutation.mutate({ email });
  };

  const handleResend = () => {
    forgotMutation.mutate({ email });
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
            Email envoyé !
          </div>
          <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] text-center max-w-[280px]">
            Vérifie ta boîte mail. Clique sur le lien pour réinitialiser ton mot
            de passe. Pense à vérifier tes spams.
          </div>
          <ButtonV2
            className="bg-primary text-txt-primary font-semibold w-full mt-4"
            label="Retour à la connexion"
            onClick={() => navigate("/login")}
          />
        </div>

        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1 justify-center">
          <div>Pas reçu ?</div>
          <button onClick={handleResend} className="text-primary font-semibold">
            Renvoyer l'email
          </button>
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
        Mot de passe oublié
      </div>
      <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] mb-6">
        Pas de stress. Entre ton email et on t'envoie un lien de
        réinitialisation.
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          icon={<Mail />}
          label="Email"
          type="email"
          placeholder="toi@email.com"
          onChange={(value) => setEmail(value)}
        />
        <ButtonV2
          className="bg-primary text-txt-primary font-semibold w-full"
          label="Envoyer le lien"
          type="submit"
          disabled={forgotMutation.isPending}
        />
      </form>

      <div className="flex flex-col flex-1 justify-end">
        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1 justify-center">
          <div>Tu te souviens ?</div>
          <Link to="/login" className="text-primary font-semibold">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

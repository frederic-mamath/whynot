import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "../../lib/trpc";
import { setToken } from "../../lib/auth";
import ButtonV2 from "@/components/ui/ButtonV2";
import Input from "@/components/ui/Input/Input";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedCgu, setAcceptedCgu] = useState(false);
  const [error, setError] = useState("");

  const isFormValid =
    email.trim().length > 0 &&
    password.length >= 6 &&
    acceptedCgu;

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      window.location.href = "/onboarding";
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("common.emailPlaceholder"));
      return;
    }

    if (password.length < 6) {
      setError(t("register.errorPasswordLength"));
      return;
    }

    registerMutation.mutate({ email, password, acceptedCgu: true });
  };

  return (
    <div className="min-h-screen px-6 py-10 flex flex-col">
      <Link
        to="/"
        className="text-muted flex gap-2 items-center mb-3 font-semibold"
      >
        <ArrowLeft size={16} />
        <div className="text-[12px]">Retour</div>
      </Link>
      <div className="font-syne text-foreground text-[22px] font-extrabold leading-[26px] mb-1">
        Créer ton compte
      </div>
      <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] mb-6">
        Rejoins Popup en quelques secondes
      </div>
      <form onSubmit={handleSubmit}>
        <Input
          className="mb-4"
          icon={<Mail />}
          label={t("common.email")}
          type="email"
          placeholder={t("common.emailPlaceholder")}
          onChange={(value) => setEmail(value)}
        />
        <Input
          className="mb-4"
          icon={<Lock />}
          label={t("common.password")}
          hint={t("register.passwordHint")}
          type="password"
          placeholder={t("common.passwordPlaceholder")}
          onChange={(value) => setPassword(value)}
        />
        <div className="rounded-xl border border-border p-4 mb-4 flex gap-3 items-start">
          <Checkbox
            id="cgu"
            checked={acceptedCgu}
            onCheckedChange={(checked) => setAcceptedCgu(checked === true)}
            className="mt-0.5 shrink-0"
          />
          <label
            htmlFor="cgu"
            className="font-outfit text-foreground text-[13px] leading-[20px] cursor-pointer"
          >
            J&apos;accepte les{" "}
            <Link
              to="/cgu"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              Conditions Générales d&apos;Utilisation
            </Link>{" "}
            et la{" "}
            <Link
              to="/politique-de-confidentialite"
              className="text-primary underline"
              onClick={(e) => e.stopPropagation()}
            >
              Politique de Confidentialité
            </Link>{" "}
            de Popup.
          </label>
        </div>
        {error && (
          <p className="text-destructive text-xs font-outfit mb-3">{error}</p>
        )}
        <ButtonV2
          className="bg-b-primary text-txt-primary font-semibold w-full"
          label={registerMutation.isPending ? "Création..." : t("register.submit")}
          type="submit"
          disabled={!isFormValid || registerMutation.isPending}
        />
      </form>
      <div className="flex flex-col flex-1 justify-end">
        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1 justify-center">
          <div>Déjà un compte ?</div>
          <Link to="/login" className="text-primary">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, AtSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "../../lib/trpc";
import { setToken } from "../../lib/auth";
import ButtonV2 from "@/components/ui/ButtonV2";
import Input from "@/components/ui/Input/Input";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isFormValid =
    nickname.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 6;

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      navigate("/dashboard");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (nickname.trim().length < 2) {
      setError("Le pseudo doit faire au moins 2 caractères");
      return;
    }

    if (!email.trim()) {
      setError(t("common.emailPlaceholder"));
      return;
    }

    if (password.length < 6) {
      setError(t("register.errorPasswordLength"));
      return;
    }

    registerMutation.mutate({ nickname, email, password });
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
          icon={<AtSign />}
          label="Pseudo"
          type="text"
          placeholder="tonpseudo"
          hint="C'est ton nom public sur Popup"
          onChange={(value) => setNickname(value)}
        />
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
          <div>Pas encore de compte ?</div>
          <Link to="/" className="text-primary">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

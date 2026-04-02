import { Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import OAuthButtons from "@/components/OAuthButtons";
import OrDivider from "@/components/OrDivider/OrDivider";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";
import { useLoginPage } from "./LoginPage.hooks";

export default function Login() {
  const { t, email, setEmail, password, setPassword, error, handleSubmit } =
    useLoginPage();

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
        Content de te revoir
      </div>
      <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] mb-6">
        Connecte-toi à ton compte Popup
      </div>
      <div className="flex flex-col gap-[10px]">
        <OAuthButtons />
      </div>
      <OrDivider />
      <div></div>
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
          type="password"
          placeholder={t("common.passwordPlaceholder")}
          onChange={(value) => setPassword(value)}
        />
        <div className="flex justify-end mb-4">
          <Link
            to="/forgot-password"
            className="text-txt-secondary text-[11px] font-semibold"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <ButtonV2
          className="bg-b-primary text-txt-primary font-semibold w-full"
          label={t("login.submit")}
          type="submit"
        />
      </form>
      <div className="flex flex-col flex-1 justify-end">
        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1 justify-center">
          <div>Pas encore de compte ?</div>
          <Link to="/register" className="text-primary">
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}

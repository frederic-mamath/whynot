import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "../../lib/trpc";
import { setToken } from "../../lib/auth";
import OAuthButtons from "@/components/OAuthButtons";
import OrDivider from "@/components/OrDivider/OrDivider";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
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
    loginMutation.mutate({ email, password });
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
        />
      </form>
      <div className="flex flex-col flex-1 justify-end">
        <div className="font-outfit text-muted-foreground text-[13px] leading-[18px] flex gap-1 justify-center">
          <div>Pas encore de compte ?</div>
          <Link to="/" className="text-primary">
            S'inscrire
          </Link>
        </div>
      </div>
      {/* <div></div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <OAuthButtons />

            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("common.emailPlaceholder")}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={t("common.passwordPlaceholder")}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isLoading}
              className="w-full"
            >
              <LogIn className="size-4 mr-2" />
              {loginMutation.isLoading
                ? t("login.submitLoading")
                : t("login.submit")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-medium"
            >
              {t("login.signUp")}
            </Link>
          </p>
        </CardFooter>
      </Card> */}
    </div>
  );
}

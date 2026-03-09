import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft, AtSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";
import { setToken } from "../lib/auth";
import ButtonV2 from "@/components/ui/ButtonV2";
import Input from "@/components/ui/Input/Input";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [oauthConflict, setOauthConflict] = useState<string[] | null>(null);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      navigate("/dashboard");
    },
    onError: (err) => {
      if (err.message.startsWith("oauth_account_exists:")) {
        const providers = err.message.split(":")[1].split(",");
        setOauthConflict(providers);
      } else {
        setError(err.message);
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("register.errorPasswordMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("register.errorPasswordLength"));
      return;
    }

    registerMutation.mutate({ email, password });
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
          type="email"
          placeholder="tonpseudo"
          hint="C'est ton nom public sur Popup"
          onChange={(value) => setEmail(value)}
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
        <ButtonV2
          className="bg-b-primary text-txt-primary font-semibold w-full"
          label={t("register.submit")}
          type="submit"
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

    // <div className="min-h-screen flex items-center justify-center bg-background p-4">
    //   <Card className="w-full max-w-md">
    //     <CardHeader>
    //       <CardTitle>{t("register.title")}</CardTitle>
    //       <CardDescription>{t("register.subtitle")}</CardDescription>
    //     </CardHeader>

    //     <CardContent>
    //       {error && (
    //         <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
    //           {error}
    //         </div>
    //       )}

    //       {oauthConflict && (
    //         <div className="mb-4 p-4 rounded-md bg-muted border space-y-3">
    //           <p className="text-sm font-medium">
    //             Un compte existe déjà avec cet e-mail via{" "}
    //             {oauthConflict
    //               .map((p) => (p === "apple" ? "Apple" : "Google"))
    //               .join(" et ")}
    //             .
    //           </p>
    //           <p className="text-sm text-muted-foreground">
    //             Connectez-vous avec votre compte existant pour continuer.
    //           </p>
    //           <div className="flex gap-2">
    //             {oauthConflict.includes("google") && (
    //               <Button
    //                 variant="outline"
    //                 size="sm"
    //                 onClick={() => {
    //                   window.location.href = "/auth/google";
    //                 }}
    //               >
    //                 Se connecter avec Google
    //               </Button>
    //             )}
    //             {oauthConflict.includes("apple") && (
    //               <Button
    //                 variant="outline"
    //                 size="sm"
    //                 onClick={() => {
    //                   window.location.href = "/auth/apple";
    //                 }}
    //               >
    //                 Se connecter avec Apple
    //               </Button>
    //             )}
    //           </div>
    //         </div>
    //       )}

    //       <form onSubmit={handleSubmit} className="space-y-4">
    //         <OAuthButtons />

    //         <div className="space-y-2">
    //           <Label htmlFor="email">{t("common.email")}</Label>
    //           <div className="relative">
    //             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    //             <Input
    //               type="email"
    //               id="email"
    //               value={email}
    //               onChange={(e) => setEmail(e.target.value)}
    //               required
    //               placeholder={t("common.emailPlaceholder")}
    //               className="pl-10"
    //             />
    //           </div>
    //         </div>

    //         <div className="space-y-2">
    //           <Label htmlFor="password">{t("common.password")}</Label>
    //           <div className="relative">
    //             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    //             <Input
    //               type="password"
    //               id="password"
    //               value={password}
    //               onChange={(e) => setPassword(e.target.value)}
    //               required
    //               placeholder={t("common.passwordPlaceholder")}
    //               minLength={6}
    //               className="pl-10"
    //             />
    //           </div>
    //           <p className="text-xs text-muted-foreground">
    //             {t("register.passwordHint")}
    //           </p>
    //         </div>

    //         <div className="space-y-2">
    //           <Label htmlFor="confirmPassword">
    //             {t("register.confirmPassword")}
    //           </Label>
    //           <div className="relative">
    //             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    //             <Input
    //               type="password"
    //               id="confirmPassword"
    //               value={confirmPassword}
    //               onChange={(e) => setConfirmPassword(e.target.value)}
    //               required
    //               placeholder={t("common.passwordPlaceholder")}
    //               minLength={6}
    //               className="pl-10"
    //             />
    //           </div>
    //         </div>

    //         <Button
    //           type="submit"
    //           disabled={registerMutation.isLoading}
    //           className="w-full"
    //         >
    //           <UserPlus className="size-4 mr-2" />
    //           {registerMutation.isLoading
    //             ? t("register.submitLoading")
    //             : t("register.submit")}
    //         </Button>
    //       </form>
    //     </CardContent>

    //     <CardFooter className="flex justify-center">
    //       <p className="text-sm text-muted-foreground">
    //         {t("register.alreadyAccount")}{" "}
    //         <Link
    //           to="/login"
    //           className="text-primary hover:underline font-medium"
    //         >
    //           {t("register.signIn")}
    //         </Link>
    //       </p>
    //     </CardFooter>
    //   </Card>
    // </div>
  );
}

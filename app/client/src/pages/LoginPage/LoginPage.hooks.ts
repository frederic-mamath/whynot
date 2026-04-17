import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import posthog from "posthog-js";
import { trpc } from "../../lib/trpc";
import { setToken } from "../../lib/auth";

export function useLoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      posthog.identify(data.user.id.toString());
      posthog.capture("login_completed", { method: "email" });
      navigate("/dashboard");
    },
    onError: () => {
      setError(
        "Identifiants incorrects. Vérifie ton e-mail et ton mot de passe, ou utilise « Mot de passe oublié ? » si tu ne t'en souviens plus.",
      );
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return {
    t,
    email,
    setEmail,
    password,
    setPassword,
    error,
    handleSubmit,
  };
}

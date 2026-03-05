import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Link2, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";
import { setToken } from "../lib/auth";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";

export default function AccountMergePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "";
  const mergeToken = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mergeMutation = trpc.auth.mergeWithPassword.useMutation({
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

    if (!mergeToken) {
      setError("Lien de fusion invalide ou expiré. Veuillez réessayer.");
      return;
    }

    mergeMutation.mutate({ mergeToken, password });
  };

  const providerLabel = provider === "apple" ? "Apple" : "Google";

  if (!mergeToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="size-12 text-destructive" />
              <p className="text-muted-foreground">
                Lien de fusion invalide ou expiré. Veuillez réessayer depuis la
                page de connexion.
              </p>
              <Button onClick={() => navigate("/login")}>
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            <CardTitle>Lier vos comptes</CardTitle>
          </div>
          <CardDescription>
            Un compte existe déjà avec cet e-mail. Entrez votre mot de passe
            actuel pour lier votre compte {providerLabel}.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe actuel</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={mergeMutation.isLoading}
              className="w-full"
            >
              <Link2 className="size-4 mr-2" />
              {mergeMutation.isLoading
                ? "Fusion en cours..."
                : `Lier mon compte ${providerLabel}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

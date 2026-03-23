import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/label";
import {
  ImageUploader,
  type ProductImageItem,
} from "@/components/ui/ImageUploader/ImageUploader";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [avatarImages, setAvatarImages] = useState<ProductImageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (nicknameError) setNicknameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameError("Le pseudo est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding.mutateAsync({
        nickname: trimmed,
        avatarUrl: avatarImages[0]?.url,
      });
      toast.success("Bienvenue !");
      navigate("/home");
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || "Une erreur est survenue";
      if (message.includes("pseudo") || message.includes("pris")) {
        setNicknameError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-black font-outfit text-foreground">
            Crée ton profil
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisis un pseudo pour rejoindre la communauté
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="space-y-2">
            <Label>
              Photo de profil{" "}
              <span className="text-muted-foreground font-normal">
                (optionnel)
              </span>
            </Label>
            <ImageUploader
              images={avatarImages}
              onImagesChange={setAvatarImages}
              maxImages={1}
            />
          </div>

          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname">
              Pseudo <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              value={nickname}
              onChange={(v) => handleNicknameChange(v)}
              placeholder="votre_pseudo"
              maxLength={50}
              autoComplete="off"
              autoCapitalize="none"
              borderClassName={nicknameError ? "border-destructive" : undefined}
            />
            {nicknameError && (
              <p className="text-xs text-destructive">{nicknameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Lettres, chiffres, _ . - uniquement
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !nickname.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Continuer"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

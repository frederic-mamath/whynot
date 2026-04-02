import ButtonV2 from "@/components/ui/ButtonV2/ButtonV2";
import Input from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ui/ImageUploader/ImageUploader";
import { Loader2 } from "lucide-react";
import { useOnboardingPage } from "./OnboardingPage.hooks";

export default function OnboardingPage() {
  const {
    nickname,
    avatarImages,
    setAvatarImages,
    isSubmitting,
    nicknameError,
    handleNicknameChange,
    handleSubmit,
  } = useOnboardingPage();

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

          <ButtonV2
            type="submit"
            className="w-full bg-primary text-primary-foreground"
            disabled={isSubmitting || !nickname.trim()}
            icon={isSubmitting ? <Loader2 className="size-4 animate-spin" /> : undefined}
            label={isSubmitting ? "Enregistrement…" : "Continuer"}
          />
        </form>
      </div>
    </div>
  );
}

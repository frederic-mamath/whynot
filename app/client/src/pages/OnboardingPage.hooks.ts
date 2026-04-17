import { useState } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { type ProductImageItem } from "@/components/ui/ImageUploader/ImageUploader";

export function useOnboardingPage() {
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
      posthog.capture("onboarding_completed", {
        has_avatar: avatarImages.length > 0,
      });
      toast.success("Bienvenue !");
      window.location.href = "/home";
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

  return {
    nickname,
    avatarImages,
    setAvatarImages,
    isSubmitting,
    nicknameError,
    handleNicknameChange,
    handleSubmit,
  };
}

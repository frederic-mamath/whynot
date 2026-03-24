import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import Input from "../components/ui/Input/Input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Container from "../components/Container";

export default function ShopCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createShopMutation = trpc.shop.create.useMutation({
    onSuccess: (shop) => {
      toast.success(t("shops.create.successCreate"));
      navigate(`/shops/${shop.id}`);
    },
    onError: (error) => {
      toast.error(error.message || t("shops.create.errorCreate"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("shops.create.errorNameRequired"));
      return;
    }

    createShopMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <Container className="py-8" size="md">
      <ButtonV2
        icon={<ArrowLeft className="size-4" />}
        label={t("shops.create.backToShops")}
        onClick={() => navigate("/shops")}
        className="bg-transparent text-foreground mb-6"
      />

      <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {t("shops.create.title")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("shops.create.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>{t("shops.create.nameLabel")}</Label>
            <Input
              type="text"
              value={name}
              onChange={(v) => setName(v)}
              placeholder={t("shops.create.namePlaceholder")}
              required
              maxLength={255}
            />
          </div>

          <div>
            <Label htmlFor="description">{t("shops.create.descLabel")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("shops.create.descPlaceholder")}
              rows={4}
            />
          </div>

          <div className="flex gap-4">
            <ButtonV2
              type="submit"
              disabled={createShopMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground"
              label={
                createShopMutation.isPending
                  ? t("shops.create.creating")
                  : t("shops.create.submit")
              }
            />
            <ButtonV2
              type="button"
              className="border border-border bg-background text-foreground"
              onClick={() => navigate("/shops")}
              label={t("shops.create.cancel")}
            />
          </div>
        </form>
      </div>
    </Container>
  );
}

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "../lib/trpc";
import ButtonV2 from "../components/ui/ButtonV2/ButtonV2";
import Input from "../components/ui/Input/Input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import VendorList from "../components/VendorList/VendorList";
import AddVendorModal from "../components/AddVendorModal/AddVendorModal";
import Container from "../components/Container";

export default function ShopDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Keep for delete redirect
  const shopId = parseInt(id || "0");

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showAddVendor, setShowAddVendor] = useState(false);

  const { data: shop, isLoading } = trpc.shop.get.useQuery(
    { shopId },
    {
      enabled: shopId > 0,
      onSuccess: (data) => {
        setName(data.name);
        setDescription(data.description || "");
      },
    },
  );

  const utils = trpc.useUtils();

  const updateShopMutation = trpc.shop.update.useMutation({
    onSuccess: () => {
      toast.success(t("shops.details.successUpdate"));
      setIsEditing(false);
      utils.shop.get.invalidate({ shopId });
      utils.shop.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("shops.details.errorUpdate"));
    },
  });

  const deleteShopMutation = trpc.shop.delete.useMutation({
    onSuccess: () => {
      toast.success(t("shops.details.successDelete"));
      navigate("/shops");
    },
    onError: (error) => {
      toast.error(error.message || t("shops.details.errorDelete"));
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t("shops.details.errorNameRequired"));
      return;
    }

    updateShopMutation.mutate({
      shopId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (window.confirm(t("shops.details.deleteConfirm"))) {
      deleteShopMutation.mutate({ shopId });
    }
  };

  const handleCancel = () => {
    if (shop) {
      setName(shop.name);
      setDescription(shop.description || "");
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Container className="py-8">
        <p>{t("shops.details.loading")}</p>
      </Container>
    );
  }

  if (!shop) {
    return (
      <Container className="py-8">
        <p>{t("shops.details.notFound")}</p>
      </Container>
    );
  }

  const isOwner = shop.role === "shop-owner";

  return (
    <Container className="py-8" size="lg">
      <ButtonV2
        icon={<ArrowLeft className="size-4" />}
        label={t("shops.details.backToShops")}
        onClick={() => navigate("/shops")}
        className="bg-transparent text-foreground mb-6"
      />

      <div className="bg-card rounded-lg border border-border p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label>
                    {t("shops.details.nameLabel")}
                  </Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(v) => setName(v)}
                    placeholder={t("shops.details.namePlaceholder")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">
                    {t("shops.details.descLabel")}
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("shops.details.descPlaceholder")}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{shop.name}</h1>
                  {shop.role === "shop-owner" && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
                      {t("shops.details.owner")}
                    </span>
                  )}
                  {shop.role === "vendor" && (
                    <span className="px-2 py-1 bg-success/20 text-success text-xs font-medium rounded">
                      {t("shops.details.vendor")}
                    </span>
                  )}
                </div>
                {shop.description && (
                  <p className="text-muted-foreground">{shop.description}</p>
                )}
              </>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <ButtonV2
                    icon={<Save className="size-4" />}
                    label={t("shops.details.save")}
                    onClick={handleSave}
                    disabled={updateShopMutation.isPending}
                    className="bg-primary text-primary-foreground"
                  />
                  <ButtonV2
                    icon={<X className="size-4" />}
                    label={t("shops.details.cancel")}
                    onClick={handleCancel}
                    className="border border-border bg-background text-foreground"
                  />
                </>
              ) : (
                <ButtonV2
                  icon={<Edit2 className="size-4" />}
                  label={t("shops.details.edit")}
                  onClick={() => setIsEditing(true)}
                  className="border border-border bg-background text-foreground"
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-6 border-t">
          <ButtonV2
            icon={<Package className="size-4" />}
            label={t("shops.details.manageProducts")}
            onClick={() => navigate(`/shops/${shopId}/products`)}
            className="border border-border bg-background text-foreground"
          />
          {isOwner && (
            <ButtonV2
              icon={<Trash2 className="size-4" />}
              label={t("shops.details.deleteShop")}
              onClick={handleDelete}
              disabled={deleteShopMutation.isPending}
              className="bg-destructive text-white"
            />
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t("shops.details.vendors")}</h2>
          {isOwner && (
            <ButtonV2
              icon={<Plus className="size-4" />}
              label={t("shops.details.addVendor")}
              onClick={() => setShowAddVendor(true)}
              className="bg-primary text-primary-foreground"
            />
          )}
        </div>

        <VendorList shopId={shopId} isOwner={isOwner} />
      </div>

      {showAddVendor && (
        <AddVendorModal
          shopId={shopId}
          onClose={() => setShowAddVendor(false)}
        />
      )}
    </Container>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "../../lib/trpc";
import ButtonV2 from "../ui/ButtonV2/ButtonV2";
import Input from "../ui/Input/Input";
import { Label } from "../ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddVendorModalProps {
  shopId: number;
  onClose: () => void;
}

export default function AddVendorModal({
  shopId,
  onClose,
}: AddVendorModalProps) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const utils = trpc.useUtils();

  const addVendorMutation = trpc.shop.addVendor.useMutation({
    onSuccess: () => {
      toast.success(t("addVendor.successAdd"));
      utils.shop.listVendors.invalidate({ id: shopId });
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || t("addVendor.errorAdd"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const id = parseInt(userId);
    if (isNaN(id) || id <= 0) {
      toast.error(t("addVendor.errorInvalidId"));
      return;
    }

    addVendorMutation.mutate({
      shopId,
      userId: id,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t("addVendor.title")}</h2>
          <button className="text-muted-foreground hover:text-foreground p-1" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("addVendor.userIdLabel")}</Label>
            <Input
              type="number"
              value={userId}
              onChange={(v) => setUserId(v)}
              placeholder={t("addVendor.userIdPlaceholder")}
              required
              min={1}
            />
            <p className="text-sm text-gray-500 mt-1">
              {t("addVendor.userIdHint")}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <ButtonV2
              type="submit"
              disabled={addVendorMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground"
              label={
                addVendorMutation.isPending
                  ? t("addVendor.adding")
                  : t("addVendor.submit")
              }
            />
            <ButtonV2
              type="button"
              className="border border-border bg-background text-foreground"
              onClick={onClose}
              label={t("addVendor.cancel")}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

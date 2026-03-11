import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Link as LinkIcon, Unlink } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { toast } from "sonner";

interface AssociateProductModalProps {
  productId: number;
  shopId: number;
  onClose: () => void;
}

export default function AssociateProductModal({
  productId,
  shopId,
  onClose,
}: AssociateProductModalProps) {
  const { t } = useTranslation();
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const utils = trpc.useUtils();

  const { data: channels = [] } = trpc.live.list.useQuery();
  const { data: associations = [] } =
    trpc.product.listChannelAssociations.useQuery({
      productId,
    });

  const associateMutation = trpc.product.associateToChannel.useMutation({
    onSuccess: () => {
      toast.success(t("associateProduct.successAssociate"));
      utils.product.listChannelAssociations.invalidate({ productId });
      setSelectedChannelId(null);
    },
    onError: (error) => {
      toast.error(`Failed to associate: ${error.message}`);
    },
  });

  const removeMutation = trpc.product.removeFromChannel.useMutation({
    onSuccess: () => {
      toast.success(t("associateProduct.successRemove"));
      utils.product.listChannelAssociations.invalidate({ productId });
    },
    onError: (error) => {
      toast.error(`Failed to remove: ${error.message}`);
    },
  });

  const handleAssociate = () => {
    if (!selectedChannelId) {
      toast.error(t("associateProduct.errorSelectChannel"));
      return;
    }

    associateMutation.mutate({
      productId,
      channelId: selectedChannelId,
    });
  };

  const handleRemove = (channelId: number) => {
    if (confirm(t("associateProduct.removeConfirm"))) {
      removeMutation.mutate({
        productId,
        channelId,
      });
    }
  };

  const associatedChannelIds = new Set(associations.map((a) => a.channelId));
  const availableChannels = channels.filter(
    (c) => !associatedChannelIds.has(c.id),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              {t("associateProduct.title")}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Association */}
          <div>
            <Label htmlFor="channel">
              {t("associateProduct.associateLabel")}
            </Label>
            <div className="flex gap-2 mt-2">
              <select
                id="channel"
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                value={selectedChannelId || ""}
                onChange={(e) =>
                  setSelectedChannelId(Number(e.target.value) || null)
                }
              >
                <option value="">{t("associateProduct.selectChannel")}</option>
                {availableChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssociate}
                disabled={!selectedChannelId || associateMutation.isPending}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                {t("associateProduct.associate")}
              </Button>
            </div>
            {availableChannels.length === 0 && associations.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {t("associateProduct.allAssociated")}
              </p>
            )}
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {t("associateProduct.noChannels")}
              </p>
            )}
          </div>

          {/* Current Associations */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              {t("associateProduct.currentAssociations")}
            </h3>
            {associations.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-center">
                {t("associateProduct.noAssociations")}
              </p>
            ) : (
              <div className="space-y-2">
                {associations.map((assoc) => {
                  const channel = channels.find(
                    (c) => c.id === assoc.channelId,
                  );
                  return (
                    <div
                      key={assoc.channelId}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {channel?.name ||
                            t("associateProduct.unknownChannel")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("associateProduct.associatedOn", {
                            date: new Date(
                              assoc.createdAt,
                            ).toLocaleDateString(),
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(assoc.channelId)}
                        disabled={removeMutation.isPending}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        {t("associateProduct.remove")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-muted border-t border-border p-6">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t("associateProduct.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}

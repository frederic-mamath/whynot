import { useState } from "react";
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
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(
    null,
  );
  const utils = trpc.useUtils();

  const { data: channels = [] } = trpc.channel.list.useQuery();
  const { data: associations = [] } =
    trpc.product.listChannelAssociations.useQuery({
      productId,
    });

  const associateMutation = trpc.product.associateToChannel.useMutation({
    onSuccess: () => {
      toast.success("Product associated with channel");
      utils.product.listChannelAssociations.invalidate({ productId });
      setSelectedChannelId(null);
    },
    onError: (error) => {
      toast.error(`Failed to associate: ${error.message}`);
    },
  });

  const removeMutation = trpc.product.removeFromChannel.useMutation({
    onSuccess: () => {
      toast.success("Association removed");
      utils.product.listChannelAssociations.invalidate({ productId });
    },
    onError: (error) => {
      toast.error(`Failed to remove: ${error.message}`);
    },
  });

  const handleAssociate = () => {
    if (!selectedChannelId) {
      toast.error("Please select a channel");
      return;
    }

    associateMutation.mutate({
      productId,
      channelId: selectedChannelId,
    });
  };

  const handleRemove = (channelId: number) => {
    if (confirm("Remove this association?")) {
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
              Channel Associations
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Association */}
          <div>
            <Label htmlFor="channel">Associate with Channel</Label>
            <div className="flex gap-2 mt-2">
              <select
                id="channel"
                className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                value={selectedChannelId || ""}
                onChange={(e) =>
                  setSelectedChannelId(Number(e.target.value) || null)
                }
              >
                <option value="">Select a channel...</option>
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
                Associate
              </Button>
            </div>
            {availableChannels.length === 0 && associations.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                All channels are already associated
              </p>
            )}
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No channels available
              </p>
            )}
          </div>

          {/* Current Associations */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              Current Associations
            </h3>
            {associations.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg text-center">
                No channel associations yet
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
                          {channel?.name || "Unknown Channel"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Associated on{" "}
                          {new Date(assoc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(assoc.channelId)}
                        disabled={removeMutation.isPending}
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Remove
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
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

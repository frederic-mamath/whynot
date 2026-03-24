import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Sparkles, ExternalLink, Gavel } from "lucide-react";
import ButtonV2 from "../ui/ButtonV2/ButtonV2";
import { Card, CardContent } from "../ui/card";
import { AuctionConfigModal } from "../AuctionConfigModal";
import { trpc } from "../../lib/trpc";
import { toast } from "sonner";

interface HighlightedProductProps {
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  };
  onClose?: () => void;
  onClick?: () => void;
  showCloseButton?: boolean;
  isHost?: boolean;
  channelId?: number;
}

export function HighlightedProduct({
  product,
  onClose,
  onClick,
  showCloseButton = true,
  isHost = false,
  channelId,
}: HighlightedProductProps) {
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const startAuctionMutation = trpc.auction.start.useMutation({
    onSuccess: () => {
      toast.success(t("highlightedProduct.auctionStarted"));
      setShowAuctionModal(false);
      if (channelId) {
        utils.auction.getActive.invalidate({ channelId });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartAuction = async (config: {
    durationSeconds: number;
    buyoutPrice?: number;
  }) => {
    await startAuctionMutation.mutateAsync({
      productId: product.id,
      ...config,
    });
  };

  return (
    <>
      <Card className="border-1 border-white bg-transparent">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Product Image */}
            <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm line-clamp-1 text-white">
                    {product.name}
                  </h3>
                </div>
                {showCloseButton && onClose && (
                  <button
                    onClick={onClose}
                    className="size-6 shrink-0 flex items-center justify-center text-white hover:text-white/70"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <p className="text-xs text-primary mb-2">{product.price}€</p>

              <p className="text-xs text-white line-clamp-2 mb-2">
                {product.description}
              </p>

              {/* Auction & View Details */}
              <div className="flex gap-2 mt-2">
                {isHost && (
                  <ButtonV2
                    icon={<Gavel className="size-3" />}
                    label={t("highlightedProduct.startAuction")}
                    onClick={() => setShowAuctionModal(true)}
                    className="h-6 text-xs bg-primary text-primary-foreground"
                    disabled={startAuctionMutation.isPending}
                  />
                )}
                {onClick && (
                  <ButtonV2
                    icon={<ExternalLink className="size-3" />}
                    label={t("highlightedProduct.viewDetails")}
                    onClick={onClick}
                    className="h-6 text-xs border border-border bg-background text-foreground"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auction Config Modal */}
      <AuctionConfigModal
        productId={product.id}
        productName={product.name}
        startingPrice={product.price}
        isOpen={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        onStart={handleStartAuction}
      />
    </>
  );
}

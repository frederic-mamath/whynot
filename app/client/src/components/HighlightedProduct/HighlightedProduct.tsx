import { useState } from "react";
import { X, Sparkles, ExternalLink, Gavel } from "lucide-react";
import Button from "../ui/button";
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
  const utils = trpc.useUtils();

  const startAuctionMutation = trpc.auction.start.useMutation({
    onSuccess: () => {
      toast.success("Auction started!");
      setShowAuctionModal(false);
      if (channelId) {
        utils.auction.getActive.invalidate({ channelId });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleStartAuction = async (config: { durationSeconds: number; buyoutPrice?: number }) => {
    await startAuctionMutation.mutateAsync({
      productId: product.id,
      ...config,
    });
  };

  return (
    <>
      <Card className="border-2 border-primary shadow-lg animate-in slide-in-from-bottom-5">
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
                  <Sparkles className="size-4 text-primary animate-pulse shrink-0" />
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {product.name}
                  </h3>
                </div>
                {showCloseButton && onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="size-6 shrink-0"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-2">
                Starting Price: <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
              </p>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {product.description}
              </p>

              {/* Auction & View Details */}
              <div className="flex gap-2 mt-2">
                {isHost && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAuctionModal(true)}
                    className="h-6 text-xs"
                    disabled={startAuctionMutation.isPending}
                  >
                    <Gavel className="size-3 mr-1" />
                    Start Auction
                  </Button>
                )}
                {onClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClick}
                    className="h-6 text-xs"
                  >
                    <ExternalLink className="size-3 mr-1" />
                    View Details
                  </Button>
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

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users as UsersIcon,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface VerticalControlPanelProps {
  audioMuted?: boolean;
  videoMuted?: boolean;
  viewerCount: number;
  productCount?: number;
  highlightedProductCount?: number;
  showBroadcastControls?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onShowParticipants: () => void;
  onShowProducts?: () => void;
  onToggleHighlightedProduct?: () => void;
  onShowShop?: () => void;
}

export default function VerticalControlPanel({
  audioMuted = false,
  videoMuted = false,
  viewerCount,
  productCount = 0,
  highlightedProductCount = 0,
  showBroadcastControls = true,
  onToggleAudio,
  onToggleVideo,
  onShowParticipants,
  onShowProducts,
  onToggleHighlightedProduct,
  onShowShop,
}: VerticalControlPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      {showBroadcastControls && onToggleAudio && (
        <button
          onClick={onToggleAudio}
          title={audioMuted ? t("controls.unmuteMic") : t("controls.muteMic")}
          className={`shrink-0 shadow-lg size-10 rounded-md flex items-center justify-center ${audioMuted ? "bg-destructive text-white" : "bg-secondary text-secondary-foreground"}`}
        >
          {audioMuted ? (
            <MicOff className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </button>
      )}

      {showBroadcastControls && onToggleVideo && (
        <button
          onClick={onToggleVideo}
          title={videoMuted ? t("controls.cameraOn") : t("controls.cameraOff")}
          className={`shrink-0 shadow-lg size-10 rounded-md flex items-center justify-center ${videoMuted ? "bg-destructive text-white" : "bg-secondary text-secondary-foreground"}`}
        >
          {videoMuted ? (
            <VideoOff className="size-5" />
          ) : (
            <Video className="size-5" />
          )}
        </button>
      )}

      <button
        onClick={onShowParticipants}
        title={t("controls.showParticipants")}
        className="shrink-0 relative shadow-lg size-10 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground"
      >
        <UsersIcon className="size-5" />
        {viewerCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
            {viewerCount}
          </span>
        )}
      </button>

      {onShowProducts && (
        <button
          onClick={onShowProducts}
          title={t("controls.showProducts")}
          className="shrink-0 relative shadow-lg size-10 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground"
        >
          <ShoppingBag className="size-5" />
          {productCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {productCount}
            </span>
          )}
        </button>
      )}

      {onToggleHighlightedProduct && (
        <button
          onClick={onToggleHighlightedProduct}
          title={t("controls.toggleHighlighted")}
          className="shrink-0 relative shadow-lg size-10 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground"
        >
          <Sparkles className="size-5" />
          {highlightedProductCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {highlightedProductCount}
            </span>
          )}
        </button>
      )}

      {showBroadcastControls && onShowShop && (
        <button
          onClick={onShowShop}
          title="Ma boutique"
          className="shrink-0 shadow-lg size-10 rounded-md flex items-center justify-center bg-secondary text-secondary-foreground"
        >
          <Store className="size-5" />
        </button>
      )}
    </div>
  );
}

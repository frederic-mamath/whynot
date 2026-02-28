import { Mic, MicOff, Video, VideoOff, Users as UsersIcon, ShoppingBag, Sparkles } from "lucide-react";
import Button from "../ui/button";

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
}: VerticalControlPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {showBroadcastControls && onToggleAudio && (
        <Button
          variant={audioMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={onToggleAudio}
          title={audioMuted ? "Unmute" : "Mute"}
          className="shrink-0 shadow-lg"
        >
          {audioMuted ? (
            <MicOff className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </Button>
      )}

      {showBroadcastControls && onToggleVideo && (
        <Button
          variant={videoMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={onToggleVideo}
          title={videoMuted ? "Turn on camera" : "Turn off camera"}
          className="shrink-0 shadow-lg"
        >
          {videoMuted ? (
            <VideoOff className="size-5" />
          ) : (
            <Video className="size-5" />
          )}
        </Button>
      )}

      <Button
        variant="secondary"
        size="icon"
        onClick={onShowParticipants}
        title="Show participants"
        className="shrink-0 relative shadow-lg"
      >
        <UsersIcon className="size-5" />
        {viewerCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
            {viewerCount}
          </span>
        )}
      </Button>

      {onShowProducts && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onShowProducts}
          title="Show promoted products"
          className="shrink-0 relative shadow-lg"
        >
          <ShoppingBag className="size-5" />
          {productCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {productCount}
            </span>
          )}
        </Button>
      )}

      {onToggleHighlightedProduct && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggleHighlightedProduct}
          title="Toggle highlighted product"
          className="shrink-0 relative shadow-lg"
        >
          <Sparkles className="size-5" />
          {highlightedProductCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
              {highlightedProductCount}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

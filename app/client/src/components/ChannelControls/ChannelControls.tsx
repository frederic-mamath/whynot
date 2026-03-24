import { useTranslation } from "react-i18next";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  PhoneOff,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelControlsProps {
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onShowParticipants: () => void;
  onLeave: () => void;
  participantCount: number;
}

export default function ChannelControls({
  audioMuted,
  videoMuted,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onShowParticipants,
  onLeave,
  participantCount,
}: ChannelControlsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-background border-t">
      <button
        onClick={onToggleAudio}
        title={audioMuted ? t("controls.unmuteMic") : t("controls.muteMic")}
        className={cn(
          "size-9 flex items-center justify-center rounded-md text-sm transition-colors",
          audioMuted
            ? "bg-destructive text-white"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {audioMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </button>

      <button
        onClick={onToggleVideo}
        title={videoMuted ? t("controls.cameraOn") : t("controls.cameraOff")}
        className={cn(
          "size-9 flex items-center justify-center rounded-md text-sm transition-colors",
          videoMuted
            ? "bg-destructive text-white"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {videoMuted ? <VideoOff className="size-4" /> : <Video className="size-4" />}
      </button>

      <button
        onClick={onToggleScreenShare}
        title={isScreenSharing ? t("controls.stopSharing") : t("controls.shareScreen")}
        className={cn(
          "size-9 flex items-center justify-center rounded-md text-sm transition-colors",
          isScreenSharing
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-background text-foreground",
        )}
      >
        <Share2 className="size-4" />
      </button>

      <button
        onClick={onShowParticipants}
        title={t("controls.showParticipants")}
        className="h-9 px-3 flex items-center gap-2 rounded-md text-sm border border-border bg-background text-foreground transition-colors"
      >
        <Users className="size-4" />
        <span>{participantCount}</span>
      </button>

      <button
        onClick={onLeave}
        title={t("controls.leaveChannel")}
        className="size-9 flex items-center justify-center rounded-md text-sm bg-destructive text-white transition-colors"
      >
        <PhoneOff className="size-4" />
      </button>
    </div>
  );
}

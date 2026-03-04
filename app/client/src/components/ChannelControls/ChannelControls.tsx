import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  PhoneOff,
  Users,
} from "lucide-react";

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
      {/* Audio Control */}
      <Button
        variant={audioMuted ? "destructive" : "secondary"}
        size="icon"
        onClick={onToggleAudio}
        title={audioMuted ? t("controls.unmuteMic") : t("controls.muteMic")}
      >
        {audioMuted ? (
          <MicOff className="size-4" />
        ) : (
          <Mic className="size-4" />
        )}
      </Button>

      {/* Video Control */}
      <Button
        variant={videoMuted ? "destructive" : "secondary"}
        size="icon"
        onClick={onToggleVideo}
        title={videoMuted ? t("controls.cameraOn") : t("controls.cameraOff")}
      >
        {videoMuted ? (
          <VideoOff className="size-4" />
        ) : (
          <Video className="size-4" />
        )}
      </Button>

      {/* Screen Share */}
      <Button
        variant={isScreenSharing ? "default" : "outline"}
        size="icon"
        onClick={onToggleScreenShare}
        title={
          isScreenSharing
            ? t("controls.stopSharing")
            : t("controls.shareScreen")
        }
      >
        <Share2 className="size-4" />
      </Button>

      {/* Participants */}
      <Button
        variant="outline"
        onClick={onShowParticipants}
        title={t("controls.showParticipants")}
      >
        <Users className="size-4" />
        <span className="ml-2">{participantCount}</span>
      </Button>

      {/* Leave Call */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onLeave}
        title={t("controls.leaveChannel")}
      >
        <PhoneOff className="size-4" />
      </Button>
    </div>
  );
}

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
  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-background border-t">
      {/* Audio Control */}
      <Button
        variant={audioMuted ? "destructive" : "secondary"}
        size="icon"
        onClick={onToggleAudio}
        title={audioMuted ? "Unmute microphone" : "Mute microphone"}
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
        title={videoMuted ? "Turn on camera" : "Turn off camera"}
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
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
      >
        <Share2 className="size-4" />
      </Button>

      {/* Participants */}
      <Button
        variant="outline"
        onClick={onShowParticipants}
        title="Show participants"
      >
        <Users className="size-4" />
        <span className="ml-2">{participantCount}</span>
      </Button>

      {/* Leave Call */}
      <Button
        variant="destructive"
        size="icon"
        onClick={onLeave}
        title="Leave channel"
      >
        <PhoneOff className="size-4" />
      </Button>
    </div>
  );
}

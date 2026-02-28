import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Mic, MicOff, Video, VideoOff, Crown, Users } from 'lucide-react';

interface ParticipantListProps {
  localUserId: number;
  remoteUsers: IAgoraRTCRemoteUser[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ParticipantList({
  localUserId,
  remoteUsers,
  isOpen,
  onClose,
}: ParticipantListProps) {
  const totalParticipants = remoteUsers.length + 1;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Participants ({totalParticipants})
          </SheetTitle>
          <SheetDescription>
            {totalParticipants === 1
              ? 'You are the only participant'
              : `${totalParticipants} people in this channel`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {/* Local User */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {localUserId.toString().charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">You</span>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Crown className="size-3" />
                  Host
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">ID: {localUserId}</span>
            </div>
          </div>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
            >
              <Avatar>
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  {user.uid.toString().charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">User {user.uid}</span>
                <span className="text-xs text-muted-foreground">ID: {user.uid}</span>
              </div>
              <div className="flex items-center gap-1">
                {user.hasAudio ? (
                  <Badge variant="default" className="size-7 p-0 flex items-center justify-center" title="Audio enabled">
                    <Mic className="size-3" />
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="size-7 p-0 flex items-center justify-center" title="Audio muted">
                    <MicOff className="size-3" />
                  </Badge>
                )}
                {user.hasVideo ? (
                  <Badge variant="default" className="size-7 p-0 flex items-center justify-center" title="Video enabled">
                    <Video className="size-3" />
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="size-7 p-0 flex items-center justify-center" title="Video disabled">
                    <VideoOff className="size-3" />
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {remoteUsers.length === 0 && (
            <div className="text-center py-8 px-4 rounded-lg bg-accent/30 border border-dashed border-border">
              <Users className="size-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">No other participants yet</p>
              <span className="text-xs text-muted-foreground">
                Share the channel link to invite others
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

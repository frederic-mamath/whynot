import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Crown, Users, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

interface ParticipantListProps {
  channelId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ParticipantList({
  channelId,
  isOpen,
  onClose,
}: ParticipantListProps) {
  const { t } = useTranslation();
  const { data: participants, isLoading } = trpc.channel.participants.useQuery(
    { channelId },
    { enabled: isOpen, refetchInterval: isOpen ? 5000 : false },
  );

  const totalParticipants = participants?.length ?? 0;

  const getInitials = (displayName: string) => {
    const parts = displayName.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-5" />
            {t("participants.title", { count: totalParticipants })}
          </SheetTitle>
          <SheetDescription>
            {totalParticipants === 0
              ? t("participants.emptyDesc")
              : totalParticipants === 1
                ? t("participants.onlyYou")
                : t("participants.countPeople", { count: totalParticipants })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {participants?.map((participant) => (
            <div
              key={participant.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-colors ${
                participant.isCurrentUser
                  ? "bg-accent/50"
                  : "hover:bg-accent/30"
              }`}
            >
              <Avatar>
                <AvatarFallback
                  className={
                    participant.isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }
                >
                  {getInitials(participant.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {participant.displayName}
                    {participant.isCurrentUser && (
                      <span className="text-muted-foreground ml-1">{t("participants.you")}</span>
                    )}
                  </span>
                  {participant.role === "host" && (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-xs shrink-0"
                    >
                      <Crown className="size-3" />
                      {t("participants.host")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoading && totalParticipants === 0 && (
            <div className="text-center py-8 px-4 rounded-lg bg-accent/30 border border-dashed border-border">
              <Users className="size-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-sm mb-1">
                {t("participants.noOthers")}
              </p>
              <span className="text-xs text-muted-foreground">
                {t("participants.shareLink")}
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

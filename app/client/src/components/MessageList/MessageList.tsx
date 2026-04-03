import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Message } from "../Message";
import { Loader2, MessageCircle } from "lucide-react";
import Placeholder from "../ui/Placeholder/Placeholder";

interface MessageListProps {
  messages: any[];
  currentUserId: number;
  isLoading?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
}: MessageListProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-white/60" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-white/60">
        <Placeholder Icon={<MessageCircle className="size-12 opacity-50" />} title={t("messages.empty")} />
      </div>
    );
  }

  return (
    <div className="relative rounded-lg ">
      <div className="absolute inset-0 w-full h-full" />
      <div
        ref={scrollRef}
        className="relative max-h-40 overflow-y-auto pb-2 px-3 pt-2 space-y-2 scroll-smooth"
      >
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}

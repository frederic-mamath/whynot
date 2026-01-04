import { useEffect, useRef } from "react";
import { Message } from "../Message";
import { Loader2, MessageCircle } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    console.log("scrooooooollliing");
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
      <div className="flex flex-col items-center justify-center h-full text-white/60 p-4">
        <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-sm text-center">
          No messages yet.
          <br />
          Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-h-64 rounded-lg ">
      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div
        ref={scrollRef}
        className="relative max-h-64 overflow-y-auto pb-2 px-3 pt-2 space-y-2 scroll-smooth"
      >
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      <div>
        {Array.from(Array(10).keys()).map(() => (
          <div style={{ margin: 16 }}>hello</div>
        ))}
      </div>
    </div>
  );
}

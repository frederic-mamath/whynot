import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageList } from "../MessageList";
import { MessageInput } from "../MessageInput";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useWebSocketStatus } from "@/hooks/useWebSocketStatus";

interface ChatPanelProps {
  channelId: number;
  currentUserId: number;
}

export function ChatPanel({ channelId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const { isConnected } = useWebSocketStatus();

  // Fetch message history via HTTP
  const { data: messageHistory, isLoading } = trpc.message.list.useQuery({
    channelId,
    limit: 100,
  });

  // Real-time subscription via WebSocket
  trpc.message.subscribe.useSubscription(
    { channelId },
    {
      onData: (newMessage) => {
        // Add message if not already in list (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      },
      onError: (error) => {
        console.error("Subscription error:", error);
        toast.error("Connection lost. Trying to reconnect...");
      },
    },
  );

  // Send message mutation (still uses HTTP)
  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: (data) => {
      // Optimistically add message (will also come via subscription)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  // Initialize messages from history
  useEffect(() => {
    if (messageHistory) {
      setMessages(messageHistory);
    }
  }, [messageHistory]);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate({
      channelId,
      content,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Connection Status */}
      <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Chat</h3>

        {/* Connection indicator */}
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500 ml-auto" title="Connected" />
        ) : (
          <WifiOff
            className="w-4 h-4 text-red-500 ml-auto animate-pulse"
            title="Disconnected"
          />
        )}

        <span className="text-xs text-muted-foreground">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
      </div>

      {/* Message Input */}
      <div className="shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          // disabled={sendMessageMutation.isLoading || !isConnected}
        />
      </div>
    </div>
  );
}

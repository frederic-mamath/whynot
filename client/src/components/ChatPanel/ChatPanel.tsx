import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageList } from "../MessageList";
import { MessageInput } from "../MessageInput";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useWebSocketStatus } from "@/hooks/useWebSocketStatus";
import { HighlightedProduct } from "../HighlightedProduct";

interface ChatPanelProps {
  channelId: number;
  currentUserId: number;
  highlightedProduct?: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  } | null;
  showHighlightedProduct?: boolean;
  onToggleHighlightedProduct?: () => void;
}

export function ChatPanel({
  channelId,
  currentUserId,
  highlightedProduct,
  showHighlightedProduct = true,
  onToggleHighlightedProduct,
}: ChatPanelProps) {
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
    <div className="flex flex-col bottom-[0] absolute w-full">
      {/* Message List - Compact overlay style */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
      />

      {/* Message Input */}
      <div className="shrink-0 p-4 bg-black/80 backdrop-blur-sm">
        <MessageInput
          onSendMessage={handleSendMessage}
          // disabled={sendMessageMutation.isLoading || !isConnected}
        />
      </div>

      {/* Highlighted Product (Above input) */}
      {highlightedProduct && showHighlightedProduct && (
        <div className="shrink-0 px-4 pb-2 bg-black/80 backdrop-blur-sm">
          <HighlightedProduct
            product={highlightedProduct}
            onClose={onToggleHighlightedProduct}
            showCloseButton={!!onToggleHighlightedProduct}
          />
        </div>
      )}
    </div>
  );
}

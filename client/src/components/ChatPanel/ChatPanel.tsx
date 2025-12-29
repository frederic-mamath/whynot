import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChatPanelProps {
  channelId: number;
  currentUserId: number;
}

export function ChatPanel({ channelId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch message history
  const { data: messageHistory, isLoading } = trpc.message.list.useQuery({
    channelId,
    limit: 100,
  });

  // Send message mutation
  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: (data) => {
      // Message will be added via subscription or we can add it immediately
      setMessages((prev) => [...prev, data]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
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
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Chat</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
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
          disabled={sendMessageMutation.isLoading}
        />
      </div>
    </div>
  );
}

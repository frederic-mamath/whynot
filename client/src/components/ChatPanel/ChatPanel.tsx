import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MessageList } from "../MessageList";
import { MessageInput } from "../MessageInput";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useWebSocketStatus } from "@/hooks/useWebSocketStatus";
import { HighlightedProduct } from "../HighlightedProduct";
import { AuctionWidget } from "../AuctionWidget";

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
  isHost?: boolean;
}

export function ChatPanel({
  channelId,
  currentUserId,
  highlightedProduct,
  showHighlightedProduct = true,
  onToggleHighlightedProduct,
  isHost = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [localEndsAt, setLocalEndsAt] = useState<string | null>(null);
  const { isConnected } = useWebSocketStatus();
  const utils = trpc.useUtils();

  // Fetch active auction
  const { data: activeAuction, refetch: refetchAuction } = trpc.auction.getActive.useQuery(
    { channelId },
    { 
      refetchInterval: 5000, // Poll every 5s as fallback
      refetchOnWindowFocus: true,
    }
  );

  // Fetch bid history if auction exists
  const { data: bids = [] } = trpc.auction.getBidHistory.useQuery(
    { auctionId: activeAuction?.id || "" },
    { enabled: !!activeAuction }
  );

  // Update local endsAt when auction changes
  useEffect(() => {
    if (activeAuction) {
      setLocalEndsAt(activeAuction.endsAt);
    }
  }, [activeAuction]);

  // Place bid mutation
  const placeBidMutation = trpc.auction.placeBid.useMutation({
    onSuccess: () => {
      toast.success("Bid placed successfully!");
      refetchAuction();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Buyout mutation
  const buyoutMutation = trpc.auction.buyout.useMutation({
    onSuccess: (data) => {
      toast.success(`Purchased for $${data.finalPrice.toFixed(2)}!`);
      refetchAuction();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePlaceBid = async (amount: number) => {
    if (!activeAuction) return;
    await placeBidMutation.mutateAsync({
      auctionId: activeAuction.id,
      amount,
    });
  };

  const handleBuyout = async () => {
    if (!activeAuction) return;
    await buyoutMutation.mutateAsync({
      auctionId: activeAuction.id,
    });
  };

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

  // WebSocket event handling for auction events
  trpc.channel.subscribeToEvents.useSubscription(
    { channelId },
    {
      enabled: true,
      onData: (event: any) => {
        switch (event.type) {
          case 'auction:started':
            toast.info("Auction started!");
            refetchAuction();
            break;
            
          case 'auction:bid_placed':
            refetchAuction();
            if (event.bidderId !== currentUserId) {
              toast.info(
                `${event.bidderUsername} bid $${event.amount.toFixed(2)}`
              );
            }
            break;
            
          case 'auction:extended':
            toast.info("Auction extended by 30 seconds!");
            setLocalEndsAt(event.newEndsAt);
            refetchAuction();
            break;
            
          case 'auction:ended':
            toast.success(
              `Auction won by ${event.winnerUsername} for $${event.finalPrice.toFixed(2)}`
            );
            refetchAuction();
            break;
            
          case 'auction:bought_out':
            toast.success(
              `${event.buyerUsername} bought for $${event.buyoutPrice.toFixed(2)}`
            );
            refetchAuction();
            break;
            
          case 'auction:outbid':
            toast.warning(
              `You've been outbid on ${event.productName}! Current bid: $${event.currentBid.toFixed(2)}`
            );
            break;
            
          case 'auction:won':
            toast.success(
              `🎉 You won ${event.productName} for $${event.finalPrice.toFixed(2)}!`
            );
            break;
        }
      },
      onError: (error) => {
        console.error("Auction events subscription error:", error);
      },
    }
  );

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

      {/* Auction or Highlighted Product (Above input) */}
      {showHighlightedProduct && (
        <div className="shrink-0 px-4 pb-2 bg-black/80 backdrop-blur-sm">
          {activeAuction ? (
            <AuctionWidget
              auction={{
                ...activeAuction,
                endsAt: localEndsAt || activeAuction.endsAt,
              }}
              bids={bids}
              currentUserId={currentUserId}
              onPlaceBid={handlePlaceBid}
              onBuyout={handleBuyout}
              isLoading={false}
            />
          ) : highlightedProduct ? (
            <HighlightedProduct
              product={highlightedProduct}
              onClose={onToggleHighlightedProduct}
              showCloseButton={!!onToggleHighlightedProduct}
              isHost={isHost}
              channelId={channelId}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

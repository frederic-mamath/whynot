import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const useShop = (liveId: string | undefined) => {
  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts = [] } = trpc.product.list.useQuery(
    { shopId: myShop?.id ?? 0 },
    { enabled: myShop !== undefined },
  );
  const { data: linkedProducts = [] } = trpc.product.listByChannel.useQuery({
    channelId: Number(liveId),
  });

  return { myShop, shopProducts, linkedProducts };
};

export const useChat = (liveId: string | undefined) => {
  const { t } = useTranslation();
  const [messageList, setMessageList] = useState<
    { id: number; userId: number; content: string }[]
  >([]);

  trpc.message.subscribe.useSubscription(
    { channelId: liveId ? Number(liveId) : 0 },
    {
      onData: (newMessage) => {
        setMessageList((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      },
      onError: (error) => {
        console.error("Subscription error:", error);
        toast.error(t("channels.chat.connectionLost"));
      },
    },
  );

  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: (data) => {
      setMessageList((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    },
    onError: (error) => {
      toast.error(error.message || t("channels.chat.sendError"));
    },
  });

  const onSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("message")?.toString().trim();

    if (liveId && content) {
      sendMessageMutation.mutate({
        channelId: Number(liveId),
        content,
      });
    }
  };

  return { messageList, onSubmitMessage };
};

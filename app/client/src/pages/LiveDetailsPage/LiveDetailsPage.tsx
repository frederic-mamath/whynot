import ButtonV2 from "@/components/ui/ButtonV2";
import IconButton from "@/components/ui/IconButton/IconButton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Icon,
  MessageCircle,
  Search,
  Share,
  Store,
} from "lucide-react";
import FadingUnderlay from "./FadingUnderlay";
import ProductListSection from "@/components/ProductListSection";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import Input from "@/components/ui/Input/Input";
import { HighlightedProduct } from "@/components/HighlightedProduct";
import { MessageList } from "@/components/MessageList";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import ProductList from "./ProductList/ProductList";

const LiveDetailsPage = () => {
  const { liveId } = useParams<{ liveId: string }>();
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [messageList, setMessageList] = useState<
    { id: number; userId: number; content: string }[]
  >([]);

  const { t } = useTranslation();

  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts = [], isLoading: isLoadingProducts } =
    trpc.product.list.useQuery(
      { shopId: myShop?.id ?? 0 },
      { enabled: myShop !== undefined },
    );
  const { data: linkedProducts = [], isLoading: isLoadingLinkedProducts } =
    trpc.product.listByChannel.useQuery({ channelId: Number(liveId) });
  trpc.message.subscribe.useSubscription(
    { channelId: liveId ? Number(liveId) : 0 },
    {
      onData: (newMessage) => {
        // Add message if not already in list (avoid duplicates)
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
      // Optimistically add message (will also come via subscription)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    },
    onError: (error) => {
      toast.error(error.message || t("channels.chat.sendError"));
    },
  });

  const toggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const onSubmitMessage = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const content = formData.get("message")?.toString().trim();

    if (liveId && content) {
      sendMessageMutation.mutate({
        channelId: liveId ? Number(liveId) : 0,
        content,
      });
    }
  };

  console.log({ shopProducts });

  return (
    <div className="h-full">
      <div
        className={cn(
          "relative",
          "min-h-screen w-full",
          "bg-white",
          "text-black",
        )}
      >
        <div className="p-6">
          <Link to="/home">
            <IconButton
              className={cn("border-white", "text-white")}
              icon={<ArrowLeft />}
              size={40}
              onClick={() => {}}
            />
          </Link>
        </div>
        <FadingUnderlay />
        <div
          className={cn(
            "flex flex-col",
            "absolute bottom-0",
            "w-full",
            "p-4 gap-2",
          )}
        >
          <div className={cn("flex", "gap-2")}>
            <div className={cn("flex flex-col flex-1", "gap-2")}>
              <MessageList
                messages={messageList}
                currentUserId={0}
                isLoading={false}
              />
              <form onSubmit={onSubmitMessage}>
                <Input
                  borderClassName={cn("border-white border-1")}
                  className={cn("text-white")}
                  type="text"
                  icon={<MessageCircle />}
                  onChange={() => {}}
                  placeholder="Ajouter un commentaire..."
                  name="message"
                />
              </form>
            </div>
            <div className={cn("flex flex-col justify-end", "gap-2")}>
              <IconButton
                className={cn("border-white", "text-white")}
                icon={<Share size={20} />}
                onClick={() => {}}
                size={50}
              />
              <IconButton
                className={cn("border-white", "text-white")}
                icon={<Store size={24} />}
                onClick={() => {}}
                size={50}
              />
            </div>
          </div>
          <div>
            {linkedProducts[0] && (
              <HighlightedProduct
                product={{
                  id: linkedProducts[0].id,
                  name: linkedProducts[0].name,
                  imageUrl: linkedProducts[0].imageUrl,
                  description: linkedProducts[0].description ?? "",
                  price: linkedProducts[0].price ?? 0,
                }}
              />
            )}
          </div>
          <div className={cn("flex", "gap-2")}>
            <ButtonV2
              className={cn("flex-1", "bg-primary", "text-primary-foreground")}
              onClick={() => {}}
              label="Acheter tout de suite"
            />
            <IconButton
              className={cn("border-primary", "text-primary")}
              icon={<div>+5€</div>}
              onClick={() => {}}
              size={50}
            />
            <IconButton
              className={cn("border-primary", "text-primary")}
              icon={<div>+10€</div>}
              onClick={() => {}}
              size={50}
            />
          </div>
        </div>
      </div>
      <div className={cn("min-h-screen w-full", "bg-b-fourth", "p-6")}>
        <div className={cn("text-black", "text-foreground", "font-bold")}>
          Boutique
        </div>
        <Input
          placeholder="Rechercher un produit"
          className="mb-4"
          borderClassName="border-muted"
          onChange={() => console.log("hey")}
          type="text"
          icon={<Search />}
        />
        <ProductList
          products={shopProducts.map((product) => ({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            wishedPrice: product.wishedPrice,
          }))}
        />
        <ProductListSection
          products={shopProducts}
          selectedProductIds={selectedProductIds}
          onToggleProduct={toggleProduct}
          onSetSelectedProducts={setSelectedProductIds}
          shopExists={!!myShop}
          onNavigateToShop={() => {
            console.log("Navigate to shop");
          }}
          onNavigateToCreateProduct={() => console.log("Navigate to shop")}
        />
      </div>
    </div>
  );
};

export default LiveDetailsPage;

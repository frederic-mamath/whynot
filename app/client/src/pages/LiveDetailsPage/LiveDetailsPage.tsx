import ButtonV2 from "@/components/ui/ButtonV2";
import IconButton from "@/components/ui/IconButton/IconButton";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageCircle, Search, Share, Store } from "lucide-react";
import FadingUnderlay from "./FadingUnderlay";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "react-router-dom";
import Input from "@/components/ui/Input/Input";
import { HighlightedProduct } from "@/components/HighlightedProduct";
import { MessageList } from "@/components/MessageList";
import ProductList from "./ProductList/ProductList";
import Tabs from "@/components/ui/Tabs";
import { useChat } from "./LiveDetailsPage.hooks";

const LiveDetailsPage = () => {
  const { liveId } = useParams<{ liveId: string }>();

  const { messageList, onSubmitMessage } = useChat(liveId);

  const { data: myShop } = trpc.shop.getMyShop.useQuery();
  const { data: shopProducts = [] } = trpc.product.list.useQuery(
    { shopId: myShop?.id ?? 0 },
    { enabled: myShop !== undefined },
  );
  const { data: linkedProducts = [] } = trpc.product.listByChannel.useQuery({
    channelId: Number(liveId),
  });

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
        <Tabs />
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
      </div>
    </div>
  );
};

export default LiveDetailsPage;

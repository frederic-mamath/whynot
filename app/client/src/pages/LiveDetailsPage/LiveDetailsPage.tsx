import ButtonV2 from "@/components/ui/ButtonV2";
import IconButton from "@/components/ui/IconButton/IconButton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Share,
  Store,
  Users,
} from "lucide-react";
import FadingUnderlay from "./FadingUnderlay";
import { Link, useParams } from "react-router-dom";
import Input from "@/components/ui/Input/Input";
import { HighlightedProduct } from "@/components/HighlightedProduct";
import { MessageList } from "@/components/MessageList";
import ProductList from "./ProductList/ProductList";
import {
  useAgora,
  useAuction,
  useChat,
  useShop,
} from "./LiveDetailsPage.hooks";
import LivePlaceholders from "./LivePlaceholders";
import MobilePage from "@/components/ui/MobilePage/MobilePage";
import Tabs from "@/components/ui/Tabs";
import { useRef, useState } from "react";
import AuctionCard from "./AuctionCard/AuctionCard";
import { AuctionConfigModal } from "@/components/AuctionConfigModal/AuctionConfigModal";

const LiveDetailsPage = () => {
  const { liveId } = useParams<{ liveId: string }>();

  const {
    joined,
    liveStatus,
    liveMeta,
    error,
    channelConfig,
    highlightedProduct,
    viewerCount,
  } = useAgora(liveId);
  const { messageList, onSubmitMessage } = useChat(liveId);
  const {
    shopProducts,
    linkedProducts,
    highlightProduct,
    unhighlightProduct,
    associateProduct,
    removeProduct,
  } = useShop(liveId);
  const {
    activeAuction,
    timeLeftSeconds,
    isAuctionModalOpen,
    setIsAuctionModalOpen,
    startAuction,
    closeAuction,
    placeBid,
    buyout,
  } = useAuction(liveId);

  const isHost = channelConfig?.isHost ?? false;
  const shopPageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("boutique");
  const [searchQuery, setSearchQuery] = useState("");

  const shopTabs = [
    { id: "boutique", label: "Boutique du live" },
    { id: "inventaire", label: "Inventaire" },
  ];

  const filteredLinkedProducts = linkedProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredShopProducts = shopProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full">
      <MobilePage
        className={cn(
          "relative",
          "min-h-screen w-full",
          "bg-white",
          "text-black",
        )}
      >
        <LivePlaceholders
          liveStatus={liveStatus}
          joined={joined}
          error={error}
          liveMeta={liveMeta}
        />
        <div
          className={cn("h-full w-full", "bg-blue", "absolute top-0 left-0")}
          id="LiveDetailsPage-video"
        />
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
          <Link to="/home">
            <IconButton
              className={cn("border-white", "text-white")}
              icon={<ArrowLeft />}
              size={40}
              onClick={() => {}}
            />
          </Link>
          <div className={cn("flex items-center gap-1", "text-white")}>
            <Users size={24} />
            <span className="text-sm font-semibold">{viewerCount}</span>
          </div>
        </div>
        <FadingUnderlay />
        <div
          className={cn(
            "flex flex-col",
            "absolute bottom-0 left-0",
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
                onClick={() =>
                  shopPageRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                size={50}
              />
            </div>
          </div>
          <div>
            {highlightedProduct && (
              <HighlightedProduct
                product={{
                  id: highlightedProduct.id,
                  name: highlightedProduct.name,
                  imageUrl: highlightedProduct.imageUrl,
                  description: highlightedProduct.description,
                  price: highlightedProduct.price,
                }}
              />
            )}
            {activeAuction && (
              <AuctionCard
                winnerNickname={activeAuction.highestBidderUsername}
                currentPrice={activeAuction.currentBid}
                timeLeftSeconds={timeLeftSeconds}
              />
            )}
          </div>
          {isHost ? (
            <div className={cn("flex", "gap-2")}>
              {!highlightedProduct && (
                <ButtonV2
                  className={cn(
                    "flex-1",
                    "bg-primary",
                    "text-primary-foreground",
                  )}
                  label="Choisir un produit à mettre en avant"
                  onClick={() => {
                    setActiveTab("boutique");
                    shopPageRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              )}
              {highlightedProduct && !activeAuction && (
                <ButtonV2
                  className={cn(
                    "flex-1",
                    "bg-primary",
                    "text-primary-foreground",
                  )}
                  label="Commencer les enchères"
                  onClick={() => setIsAuctionModalOpen(true)}
                />
              )}
              {activeAuction && activeAuction.highestBidderId && (
                <ButtonV2
                  className={cn(
                    "flex-1",
                    "bg-primary",
                    "text-primary-foreground",
                  )}
                  label={`Vendre à ${activeAuction.highestBidderUsername}`}
                  onClick={closeAuction}
                />
              )}
              {activeAuction && !activeAuction.highestBidderId && (
                <ButtonV2
                  className={cn(
                    "flex-1",
                    "bg-destructive",
                    "text-primary-foreground",
                  )}
                  label="Annuler l'enchère"
                  onClick={closeAuction}
                />
              )}
            </div>
          ) : (
            <div className={cn("flex", "gap-2")}>
              <ButtonV2
                className={cn(
                  "flex-1",
                  "bg-primary",
                  "text-primary-foreground",
                )}
                onClick={buyout}
                disabled={!activeAuction || !activeAuction.buyoutPrice}
                label="Acheter tout de suite"
              />
              <IconButton
                className={cn(
                  "border-primary",
                  "text-primary",
                  !activeAuction && "opacity-50 cursor-not-allowed",
                )}
                icon={<div>+1€</div>}
                onClick={
                  activeAuction
                    ? () => placeBid(activeAuction.currentBid + 1)
                    : () => {}
                }
                size={50}
              />
              <IconButton
                className={cn(
                  "border-primary",
                  "text-primary",
                  !activeAuction && "opacity-50 cursor-not-allowed",
                )}
                icon={<div>+5€</div>}
                onClick={
                  activeAuction
                    ? () => placeBid(activeAuction.currentBid + 5)
                    : () => {}
                }
                size={50}
              />
              <IconButton
                className={cn(
                  "border-primary",
                  "text-primary",
                  !activeAuction && "opacity-50 cursor-not-allowed",
                )}
                icon={<div>+10€</div>}
                onClick={
                  activeAuction
                    ? () => placeBid(activeAuction.currentBid + 10)
                    : () => {}
                }
                size={50}
              />
            </div>
          )}
          {isHost && highlightedProduct && (
            <AuctionConfigModal
              productId={highlightedProduct.id}
              productName={highlightedProduct.name}
              startingPrice={highlightedProduct.price}
              isOpen={isAuctionModalOpen}
              onClose={() => setIsAuctionModalOpen(false)}
              onStart={async (config) => {
                await startAuction(highlightedProduct.id, {
                  durationSeconds: config.durationSeconds as
                    | 60
                    | 300
                    | 600
                    | 1800,
                  buyoutPrice: config.buyoutPrice,
                });
              }}
            />
          )}
        </div>
      </MobilePage>
      <div ref={shopPageRef}>
        <MobilePage>
          {isHost && (
            <Tabs
              selectedTabId={activeTab}
              items={shopTabs}
              onClickItem={(id) => {
                setActiveTab(id);
                setSearchQuery("");
              }}
            />
          )}
          <Input
            placeholder="Rechercher un produit"
            className="mb-4 mt-4"
            borderClassName="border-muted"
            onChange={(value) => setSearchQuery(value)}
            type="text"
            icon={<Search />}
          />
          {(!isHost || activeTab === "boutique") && (
            <ProductList
              products={filteredLinkedProducts.map((p) => ({
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                wishedPrice: p.wishedPrice,
              }))}
              variant={isHost ? "host-boutique" : "buyer"}
              highlightedProductId={highlightedProduct?.id}
              onHighlight={highlightProduct}
              onUnhighlight={unhighlightProduct}
            />
          )}
          {isHost && activeTab === "inventaire" && (
            <ProductList
              products={filteredShopProducts.map((p) => ({
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                wishedPrice: p.wishedPrice,
              }))}
              variant="host-inventaire"
              associatedProductIds={linkedProducts.map((p) => p.id)}
              onAssociate={associateProduct}
              onRemove={removeProduct}
            />
          )}
        </MobilePage>
      </div>
    </div>
  );
};

export default LiveDetailsPage;

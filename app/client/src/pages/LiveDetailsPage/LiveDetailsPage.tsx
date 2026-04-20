import ButtonV2 from "@/components/ui/ButtonV2";
import DevicePicker from "@/components/DevicePicker/DevicePicker";
import IconButton from "@/components/ui/IconButton/IconButton";
import SwipeToBid from "@/components/ui/SwipeToBid/SwipeToBid";
import { BidRequirementsDialog } from "@/components/BidRequirementsDialog/BidRequirementsDialog";
import { PaymentSetupDialog } from "@/components/PaymentSetupDialog";
import MondialRelayMapDialog from "@/components/MondialRelayMapDialog/MondialRelayMapDialog";
import { PersonalInfoDialog } from "@/components/PersonalInfoDialog/PersonalInfoDialog";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Send,
  Share,
  Store,
  Trophy,
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
import { AuctionEndModal } from "@/components/AuctionEndModal";
import { toast } from "sonner";

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
    cameras,
    microphones,
    selectedCameraId,
    selectedMicId,
    switchCamera,
    switchMicrophone,
    enumerateDevices,
  } = useAgora(liveId);
  const { messageList, messageInput, setMessageInput, onSubmitMessage } =
    useChat(liveId);
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
    bidIncrement,
    selectIncrement,
    onConfirmBid,
    isBidRequirementsOpen,
    setIsBidRequirementsOpen,
    showPaymentSetup,
    setShowPaymentSetup,
    showAddressSetup,
    setShowAddressSetup,
    paymentDone,
    addressDone,
    onAllRequirementsMet,
    paymentStatusUtils,
    showPersonalInfo,
    setShowPersonalInfo,
    fullNameDone,
    profileFirstName,
    profileLastName,
    savePersonalInfo,
    saveRelayAddress,
  } = useAuction(liveId);

  const isHost = channelConfig?.isHost ?? false;
  const shopPageRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("boutique");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);
  const [endedAuction, setEndedAuction] = useState<{
    productName: string;
    productImage: string | null;
    finalPrice: number;
    winnerUsername: string;
    winnerId: number | null;
    totalBids: number;
    isParticipant: boolean;
  } | null>(null);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien du live copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleDebugAuctionEnd = () => {
    setEndedAuction({
      productName: activeAuction?.productName ?? "Produit test",
      productImage: activeAuction?.productImageUrl ?? null,
      finalPrice: activeAuction?.currentBid ?? 25,
      winnerUsername: activeAuction?.highestBidderUsername ?? "testuser",
      winnerId: activeAuction?.highestBidderId ?? null,
      totalBids: 5,
      isParticipant: false,
    });
    setShowEndModal(true);
  };

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
    <div className="h-full overflow-x-hidden">
      <MobilePage
        className={cn(
          "relative",
          "min-h-screen w-full",
          "bg-white",
          "text-black",
          "p-0",
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
              <form
                onSubmit={onSubmitMessage}
                className="flex gap-2 items-center items-end"
              >
                <Input
                  borderClassName={cn("border-white border-1")}
                  className={cn("text-white flex-1")}
                  type="text"
                  icon={<MessageCircle />}
                  value={messageInput}
                  onChange={setMessageInput}
                  placeholder="Ajouter un commentaire..."
                  name="message"
                />
                <IconButton
                  className={cn(
                    "border-white text-white shrink-0",
                    !messageInput.trim() && "opacity-40",
                  )}
                  icon={<Send size={20} />}
                  size={50}
                  onClick={() => {}}
                  type="submit"
                  disabled={!messageInput.trim()}
                />
              </form>
            </div>
            <div className={cn("flex flex-col justify-end", "gap-2")}>
              <IconButton
                className={cn("border-white", "text-white")}
                icon={<Trophy size={20} />}
                onClick={handleDebugAuctionEnd}
                size={50}
              />
              <IconButton
                className={cn("border-white", "text-white")}
                icon={<Share size={20} />}
                onClick={handleShare}
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
              {isHost && (
                <DevicePicker
                  cameras={cameras}
                  microphones={microphones}
                  selectedCameraId={selectedCameraId}
                  selectedMicId={selectedMicId}
                  onSwitchCamera={switchCamera}
                  onSwitchMicrophone={switchMicrophone}
                  onOpen={enumerateDevices}
                />
              )}
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
                    "text-destructive-foreground",
                  )}
                  label="Annuler l'enchère"
                  onClick={closeAuction}
                />
              )}
            </div>
          ) : (
            <div className={cn("flex flex-col", "gap-2")}>
              <div className="flex gap-2">
                {([1, 5, 10] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => selectIncrement(n)}
                    disabled={!activeAuction}
                    className={cn(
                      "flex-1 h-12 rounded-full border text-sm font-semibold transition-colors",
                      bidIncrement === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-primary border-primary",
                      !activeAuction && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    +{n}€
                  </button>
                ))}
              </div>
              <SwipeToBid
                amount={(activeAuction?.currentBid ?? 0) + bidIncrement}
                onConfirm={onConfirmBid}
                disabled={!activeAuction}
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
          <BidRequirementsDialog
            open={isBidRequirementsOpen}
            onOpenChange={setIsBidRequirementsOpen}
            requirements={[
              {
                id: "name",
                label: "Informations personnelles",
                description: "Prénom et nom requis pour la livraison",
                done: fullNameDone,
                onComplete: () => setShowPersonalInfo(true),
              },
              {
                id: "payment",
                label: "Moyen de paiement",
                description: "Carte bancaire, Google Pay ou Apple Pay",
                done: paymentDone,
                onComplete: () => setShowPaymentSetup(true),
              },
              {
                id: "address",
                label: "Adresse de livraison",
                description: "Point Relais Mondial Relay ou adresse personnelle",
                done: addressDone,
                onComplete: () => setShowAddressSetup(true),
              },
            ]}
            onAllComplete={onAllRequirementsMet}
          />
          <PersonalInfoDialog
            open={showPersonalInfo}
            onOpenChange={setShowPersonalInfo}
            initialFirstName={profileFirstName}
            initialLastName={profileLastName}
            onSave={savePersonalInfo}
          />
          <PaymentSetupDialog
            open={showPaymentSetup}
            onOpenChange={setShowPaymentSetup}
            onSuccess={() => {
              paymentStatusUtils.invalidate();
              setShowPaymentSetup(false);
            }}
          />
          <MondialRelayMapDialog
            open={showAddressSetup}
            onOpenChange={setShowAddressSetup}
            onSave={(point) => {
              saveRelayAddress(point);
              setShowAddressSetup(false);
            }}
          />
        </div>
      </MobilePage>
      {endedAuction && (
        <AuctionEndModal
          open={showEndModal}
          onOpenChange={setShowEndModal}
          productName={endedAuction.productName}
          productImage={endedAuction.productImage}
          finalBid={endedAuction.finalPrice}
          winnerUsername={endedAuction.winnerUsername}
          totalBids={endedAuction.totalBids}
          isWinner={endedAuction.winnerId != null}
          isParticipant={endedAuction.isParticipant}
        />
      )}
      <div ref={shopPageRef} className="min-h-screen w-full bg-b-fourth py-6">
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
        <div className="px-4">
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
        </div>
      </div>
    </div>
  );
};

export default LiveDetailsPage;

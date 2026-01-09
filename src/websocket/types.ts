// WebSocket message types for real-time channel events

export interface ProductHighlightedMessage {
  type: 'PRODUCT_HIGHLIGHTED';
  channelId: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  };
  highlightedAt: string; // ISO date string
}

export interface ProductUnhighlightedMessage {
  type: 'PRODUCT_UNHIGHLIGHTED';
  channelId: number;
}

export interface ChatMessage {
  type: 'CHAT_MESSAGE';
  channelId: number;
  userId: number;
  username: string;
  message: string;
  timestamp: string;
}

export interface UserJoinedMessage {
  type: 'USER_JOINED';
  channelId: number;
  userId: number;
  username: string;
}

export interface UserLeftMessage {
  type: 'USER_LEFT';
  channelId: number;
  userId: number;
}

// Auction-related messages
export interface AuctionStartedMessage {
  type: 'auction:started';
  auction: any; // AuctionOutboundDto
}

export interface AuctionBidPlacedMessage {
  type: 'auction:bid_placed';
  auctionId: string;
  bidderUsername: string;
  amount: number;
  nextMinBid: number;
  newEndsAt?: string;
}

export interface AuctionExtendedMessage {
  type: 'auction:extended';
  auctionId: string;
  newEndsAt: string;
}

export interface AuctionEndedMessage {
  type: 'auction:ended';
  auctionId: string;
  winnerId: number | null;
  winnerUsername: string | null;
  finalPrice: number;
  hasWinner: boolean;
}

export interface AuctionBoughtOutMessage {
  type: 'auction:bought_out';
  auctionId: string;
  buyerId: number;
  buyerUsername: string;
  buyoutPrice: number;
}

export interface AuctionOutbidMessage {
  type: 'auction:outbid';
  auctionId: string;
  productName: string;
  yourBid: number;
  currentBid: number;
}

export interface AuctionWonMessage {
  type: 'auction:won';
  orderId: string;
  productName: string;
  finalPrice: number;
  paymentDeadline: string;
}

export type WebSocketMessage =
  | ProductHighlightedMessage
  | ProductUnhighlightedMessage
  | ChatMessage
  | UserJoinedMessage
  | UserLeftMessage
  | AuctionStartedMessage
  | AuctionBidPlacedMessage
  | AuctionExtendedMessage
  | AuctionEndedMessage
  | AuctionBoughtOutMessage
  | AuctionOutbidMessage
  | AuctionWonMessage;

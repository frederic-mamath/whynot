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

export type WebSocketMessage =
  | ProductHighlightedMessage
  | ProductUnhighlightedMessage
  | ChatMessage
  | UserJoinedMessage
  | UserLeftMessage;

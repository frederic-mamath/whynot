// Discriminated union of every event the iOS / web tRPC clients receive via
// `live.subscribeToEvents`. These events are emitted on the internal
// `liveEvents` EventEmitter and forwarded to subscribers.
//
// Note: events that ONLY go through `broadcastToChannel` (raw WebSocket, used
// by the web client) are NOT included here. The web client has its own typed
// WebSocketMessage union in src/websocket/types.ts. If you want an event to
// reach the iOS client, you must emit it on `liveEvents` as well.

export type ProductHighlightedEvent = {
  type: "PRODUCT_HIGHLIGHTED";
  channelId: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  };
  highlightedAt: string;
};

export type ProductUnhighlightedEvent = {
  type: "PRODUCT_UNHIGHLIGHTED";
  channelId: number;
};

export type AuctionEndedEvent = {
  type: "auction:ended";
  auctionId: string;
  winnerId: number | null;
  winnerUsername: string | null;
  finalPrice: number;
  hasWinner: boolean;
};

export type LiveEvent =
  | ProductHighlightedEvent
  | ProductUnhighlightedEvent
  | AuctionEndedEvent;

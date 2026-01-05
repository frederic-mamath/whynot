import { WebSocket } from 'ws';
import { WebSocketMessage } from './types';

// Global map: channelId → Set<WebSocket>
const channelConnectionsMap = new Map<number, Set<WebSocket>>();

// Map to track which channel each WebSocket is in
const wsToChannelMap = new WeakMap<WebSocket, number>();

/**
 * Add a WebSocket connection to a channel
 */
export function addUserToChannel(channelId: number, ws: WebSocket): void {
  if (!channelConnectionsMap.has(channelId)) {
    channelConnectionsMap.set(channelId, new Set());
  }
  channelConnectionsMap.get(channelId)!.add(ws);
  wsToChannelMap.set(ws, channelId);
  
  console.log(`👥 User added to channel ${channelId}, total connections: ${channelConnectionsMap.get(channelId)!.size}`);
}

/**
 * Remove a WebSocket connection from a channel
 */
export function removeUserFromChannel(channelId: number, ws: WebSocket): void {
  const connections = channelConnectionsMap.get(channelId);
  if (connections) {
    connections.delete(ws);
    console.log(`👋 User removed from channel ${channelId}, remaining connections: ${connections.size}`);
    
    if (connections.size === 0) {
      channelConnectionsMap.delete(channelId);
      console.log(`🗑️ Channel ${channelId} has no more connections, removed from map`);
    }
  }
}

/**
 * Remove a WebSocket from whatever channel it's in
 */
export function removeUserFromAnyChannel(ws: WebSocket): void {
  const channelId = wsToChannelMap.get(ws);
  if (channelId !== undefined) {
    removeUserFromChannel(channelId, ws);
  }
}

/**
 * Get all WebSocket connections for a specific channel
 */
export function getChannelConnections(channelId: number): Set<WebSocket> {
  return channelConnectionsMap.get(channelId) || new Set();
}

/**
 * Broadcast a message to all users in a channel
 */
export function broadcastToChannel(
  channelId: number,
  message: WebSocketMessage
): void {
  const connections = getChannelConnections(channelId);
  const messageStr = JSON.stringify(message);
  
  let sentCount = 0;
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
      sentCount++;
    }
  });
  
  console.log(`📡 Broadcast ${message.type} to channel ${channelId}: ${sentCount}/${connections.size} recipients`);
}

/**
 * Send a message to a specific WebSocket connection
 */
export function sendToConnection(ws: WebSocket, message: WebSocketMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Get the number of connections in a channel
 */
export function getChannelConnectionCount(channelId: number): number {
  return getChannelConnections(channelId).size;
}

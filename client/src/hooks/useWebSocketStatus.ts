import { useState, useEffect } from 'react';
import { wsClient } from '../lib/trpc';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Access the underlying WebSocket connection
    const connection = (wsClient as any).getConnection?.();
    
    if (!connection) {
      setStatus('disconnected');
      return;
    }

    const handleOpen = () => {
      setStatus('connected');
      setIsConnected(true);
      console.log('🟢 WebSocket connected');
    };

    const handleClose = () => {
      setStatus('disconnected');
      setIsConnected(false);
      console.log('🔴 WebSocket disconnected');
    };

    const handleError = () => {
      setStatus('error');
      setIsConnected(false);
      console.log('⚠️ WebSocket error');
    };

    // Check current state
    if (connection.readyState === WebSocket.OPEN) {
      setStatus('connected');
      setIsConnected(true);
    } else if (connection.readyState === WebSocket.CONNECTING) {
      setStatus('connecting');
    } else {
      setStatus('disconnected');
    }

    // Listen to events
    connection.addEventListener('open', handleOpen);
    connection.addEventListener('close', handleClose);
    connection.addEventListener('error', handleError);

    return () => {
      connection.removeEventListener('open', handleOpen);
      connection.removeEventListener('close', handleClose);
      connection.removeEventListener('error', handleError);
    };
  }, []);

  return { status, isConnected };
}

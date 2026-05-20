// WebSocket service for real-time updates
import { WS_URL } from "@/lib/config";

type WebSocketPayload = Record<string, unknown>;

type WebSocketMessage = {
  type: string;
  data?: WebSocketPayload;
  message?: string;
  timestamp?: string;
} & WebSocketPayload;

const HEARTBEAT_INTERVAL_MS = 25_000;

type WebSocketEventHandler = (data: WebSocketPayload) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private userId: string | null = null;
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private subscribedChats: Set<string> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastPongAt: number | null = null;

  connect(userId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.userId = userId;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastPongAt = Date.now();

        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
        }
        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping', ts: Date.now() });
          }
        }, HEARTBEAT_INTERVAL_MS);

        // Register user for real-time updates
        if (this.userId) {
          this.send({ type: 'register', userId: this.userId });
        }

        // Re-subscribe to active chats after reconnect
        this.subscribedChats.forEach((chatId) => {
          this.send({ type: 'chat:subscribe', chatId });
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'pong') {
            this.lastPongAt = Date.now();
            return;
          }

          // Handle typing:auto-stop
          if (message.type === 'typing:update' && message.data?.isTyping) {
            const key = `${message.data.chatId}-${message.data.userId}`;
            if (this.typingTimers.has(key)) {
              clearTimeout(this.typingTimers.get(key));
            }
            const timer = setTimeout(() => {
              this.typingTimers.delete(key);
              const handlers = this.eventHandlers.get('typing:update');
              if (handlers) {
                handlers.forEach(handler => handler({ ...message.data, isTyping: false }));
              }
            }, 3000);
            this.typingTimers.set(key, timer);
          }

          // Trigger event handlers
          const handlers = this.eventHandlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => handler(message.data));
          }

          // Also trigger generic handler
          const allHandlers = this.eventHandlers.get('*');
          if (allHandlers) {
            allHandlers.forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;

      setTimeout(() => {
        this.connect(this.userId!);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.userId = null;
    this.subscribedChats.clear();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.lastPongAt = null;
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }

  // Typing events
  sendTypingStart(chatId: string): void {
    this.send({ type: 'typing:start', chatId });
  }

  sendTypingStop(chatId: string): void {
    this.send({ type: 'typing:stop', chatId });
  }

  // Chat subscriptions
  subscribeChat(chatId: string): void {
    this.subscribedChats.add(String(chatId));
    this.send({ type: 'chat:subscribe', chatId });
  }

  unsubscribeChat(chatId: string): void {
    this.subscribedChats.delete(String(chatId));
    this.send({ type: 'chat:unsubscribe', chatId });
  }

  // Read receipts
  sendChatRead(chatId: string, lastReadMessageId: string): void {
    this.send({ type: 'chat:read', chatId, lastReadMessageId });
  }

  // Message delivered
  sendMessageDelivered(messageId: string): void {
    this.send({ type: 'message:delivered', messageId });
  }

  on<T = WebSocketPayload>(eventType: string, handler: (data: T) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as WebSocketEventHandler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler as WebSocketEventHandler);
    };
  }

  off(eventType: string, handler: WebSocketEventHandler): void {
    this.eventHandlers.get(eventType)?.delete(handler);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  terminateSession(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(4001, 'Session terminated');
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// Hook for React components
export { WebSocketService };

// Notification types
export type NotificationType = 'message' | 'reply' | 'mention' | 'reaction' | 'server_invite';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  entityId: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
}

export interface MarkAsReadRequest {
  notificationId?: string;
  markAllAsRead?: boolean;
}

export interface WebSocketNotificationData {
  userId: string;
  type: NotificationType;
  entityId: string | null;
  timestamp: string;
}

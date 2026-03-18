// Notification types
export type NotificationType =
  | 'message'
  | 'reaction'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'reply'
  | 'post_resonance'
  | 'post_comment';

export interface Notification {
  id: string;
  type: NotificationType;
  actor_id: string | null;
  actor_username: string | null;
  actor_avatar: string | null;
  target_id: string | null;
  target_type: string | null;
  message: string | null;
  read: boolean;
  created_at: string;
  url: string | null;
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
  actor_id: string | null;
  actor_username: string | null;
  actor_avatar: string | null;
  target_id: string | null;
  target_type: string | null;
  message: string | null;
  url: string | null;
  timestamp: string;
}

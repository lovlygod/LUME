import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, X, MessageCircle, AtSign, Heart, Users, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification, NotificationType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { wsService } from '@/services/websocket';
import { apiRequest } from '@/services/api';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Notify when panel closes
  useEffect(() => {
    if (!open) {
      window.dispatchEvent(new CustomEvent('notifications:closed'));
    }
  }, [open]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await apiRequest<{ notifications: Notification[] }>('/notifications', {
        method: 'GET',
      });
      setNotifications(data.notifications);
      const newUnreadCount = data.notifications.filter((n: Notification) => !n.read).length;
      setUnreadCount(newUnreadCount);
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { count: newUnreadCount } }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      await apiRequest('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({
          notificationId,
          markAllAsRead: !notificationId,
        }),
      });
      if (notificationId) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
      window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { count: 0 } }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onOpenChange(false);
  };

  // Fetch on mount and when panel opens
  useEffect(() => {
    if (!open || !user) return;
    const run = async () => {
      await fetchNotifications();
      await markAsRead();
    };
    void run();
  }, [open, user, markAsRead, fetchNotifications]);

  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (!user) return;

    const handleNotification = (data: { type: NotificationType; entityId: string; timestamp: string }) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        userId: user.id,
        type: data.type,
        entityId: data.entityId,
        read: false,
        createdAt: data.timestamp,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    // Subscribe via wsService
    const unsubscribe = wsService.on('notification_new', handleNotification);

    return () => {
      unsubscribe();
    };
  }, [user]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      case 'reply':
        return <Reply className="h-4 w-4" />;
      case 'mention':
        return <AtSign className="h-4 w-4" />;
      case 'reaction':
        return <Heart className="h-4 w-4" />;
      case 'server_invite':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return 'bg-blue-500/20 text-blue-400';
      case 'reply':
        return 'bg-green-500/20 text-green-400';
      case 'mention':
        return 'bg-purple-500/20 text-purple-400';
      case 'reaction':
        return 'bg-red-500/20 text-red-400';
      case 'server_invite':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getNotificationText = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return t('notifications.new_message') || 'Новое сообщение';
      case 'reply':
        return t('notifications.reply') || 'Ответ';
      case 'mention':
        return t('notifications.mention') || 'Упоминание';
      case 'reaction':
        return t('notifications.reaction') || 'Реакция';
      case 'server_invite':
        return t('notifications.server_invite') || 'Приглашение на сервер';
      default:
        return t('notifications.new') || 'Новое уведомление';
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-full left-0 mb-2 w-[380px] glass-panel rounded-2xl overflow-hidden shadow-2xl z-50 border border-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-white/70" />
                <h2 className="text-sm font-semibold text-white">
                  {t('notifications.title') || 'Уведомления'}
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsRead()}
                    title={t('notifications.mark_all_read') || 'Отметить все как прочитанные'}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-white/20 mb-3" />
                  <p className="text-sm text-white/50">
                    {t('notifications.empty') || 'Нет уведомлений'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div
                        className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white">
                          {getNotificationText(notification.type)}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                          {new Date(notification.createdAt).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification, NotificationType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { wsService } from '@/services/websocket';
import { apiRequest } from '@/services/api';
import Avatar from '@/components/Avatar';
import { normalizeImageUrl } from '@/lib/utils';
import { getProfileRoute } from '@/lib/profileRoute';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  // Notify when panel closes
  useEffect(() => {
    if (!open) {
      window.dispatchEvent(new CustomEvent('notifications:closed'));
    }
  }, [open]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (nextOffset = 0, append = false) => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await apiRequest<{ notifications: Notification[]; limit?: number; offset?: number }>('/notifications?limit=20&offset=' + nextOffset, {
        method: 'GET',
      });
      setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications);
      setOffset(nextOffset + data.notifications.length);
      setHasMore(data.notifications.length >= limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      if (notificationId) {
        await apiRequest(`/notifications/${notificationId}/read`, { method: 'POST' });
      } else {
        await apiRequest('/notifications/read', {
          method: 'POST',
          body: JSON.stringify({
            markAllAsRead: true,
          }),
        });
      }
      if (notificationId) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.url) {
      navigate(notification.url);
    }
    onOpenChange(false);
  };

  const handleActorClick = useCallback((event: React.MouseEvent, notification: Notification) => {
    event.stopPropagation();
    if (!notification.actor_id && !notification.actor_username) return;
    navigate(getProfileRoute({ id: notification.actor_id || undefined, username: notification.actor_username || undefined }));
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  // Fetch on mount and when panel opens
  useEffect(() => {
    if (!open || !user) return;
    const run = async () => {
      setOffset(0);
      setHasMore(true);
      await fetchNotifications(0, false);
    };
    void run();
  }, [open, user, markAsRead, fetchNotifications]);

  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (!user) return;

    const handleNotification = (data: { type: NotificationType; actor_id?: string; actor_username?: string; actor_avatar?: string; message?: string; url?: string; timestamp: string }) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: data.type,
        actor_id: data.actor_id || null,
        actor_username: data.actor_username || null,
        actor_avatar: data.actor_avatar || null,
        target_id: null,
        target_type: null,
        message: data.message || null,
        read: false,
        created_at: data.timestamp,
        url: data.url || null,
      };

      setNotifications(prev => [newNotification, ...prev]);
    };

    // Subscribe via wsService
    const unsubscribe = wsService.on('notification_new', handleNotification);

    return () => {
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: { count: unreadCount } }));
  }, [unreadCount]);


  const resolveLabel = useCallback((key: string, fallback: string) => {
    const value = t(key);
    if (value === key || value.startsWith('time.') || value.startsWith('notifications.')) {
      return fallback;
    }
    return value;
  }, [t]);

  const resolveTimeLabel = useCallback((camelKey: string, snakeKey: string, fallback: string) => {
    const camel = resolveLabel(camelKey, '');
    if (camel) return camel;
    return resolveLabel(snakeKey, fallback);
  }, [resolveLabel]);


  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return resolveTimeLabel('time.justNow', 'time.just_now', 'just now');
    if (diffMinutes < 60) return resolveTimeLabel('time.minutesAgo', 'time.minutes_ago', `${diffMinutes} minutes ago`).replace('{count}', String(diffMinutes));
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return resolveTimeLabel('time.hoursAgo', 'time.hours_ago', `${diffHours} hours ago`).replace('{count}', String(diffHours));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return resolveTimeLabel('time.yesterday', 'time.yesterday', 'yesterday');
    return resolveTimeLabel('time.daysAgo', 'time.days_ago', `${diffDays} days ago`).replace('{count}', String(diffDays));
  }, [resolveTimeLabel]);

  const buildDefaultMessage = useCallback((notification: Notification) => {
    const actorName = notification.actor_username || resolveLabel('notifications.someone', 'Someone');
    const fallback = resolveLabel(`notifications.fallback.${notification.type}`, resolveLabel('notifications.new', 'New notification'));
    return fallback.replace('{actor}', actorName);
  }, [resolveLabel]);

  const getNotificationMessage = useCallback((notification: Notification) => {
    return notification.message || buildDefaultMessage(notification);
  }, [buildDefaultMessage]);

  const getActionLabel = useCallback((notification: Notification) => {
    const actionKey = `notifications.action.${notification.type}`;
    const fallback = resolveLabel('notifications.action.default', resolveLabel('notifications.new', 'New notification'));
    return resolveLabel(actionKey, fallback);
  }, [resolveLabel]);

  const renderNotificationText = useCallback((notification: Notification & { groupCount?: number }) => {
    if (notification.groupCount && notification.groupCount > 1) {
      return getNotificationMessage(notification);
    }

    const actorLabel = notification.actor_username
      || (typeof notification.actor_id === 'string' ? notification.actor_id : notification.actor_id ? String(notification.actor_id) : '')
      || resolveLabel('notifications.someone', 'Someone');
    const actionLabel = getActionLabel(notification);

    if (!actionLabel || actionLabel === resolveLabel('notifications.new', 'New notification')) {
      return getNotificationMessage(notification);
    }

    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span
          role="button"
          tabIndex={0}
          className="text-white underline-offset-2 hover:underline"
          onClick={(event) => handleActorClick(event, notification)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              handleActorClick(event as unknown as React.MouseEvent, notification);
            }
          }}
        >
          {actorLabel}
        </span>
        <span>{actionLabel}</span>
      </span>
    );
  }, [getActionLabel, getNotificationMessage, handleActorClick, resolveLabel]);

  const groupedNotifications = useMemo(() => {
    const groupableTypes = new Set<NotificationType>([
      'reaction',
      'post_resonance',
      'post_comment',
      'comment',
      'follow',
      'mention',
      'reply',
    ]);
    const groups = new Map<string, Notification[]>();
    notifications.forEach((notification) => {
      const key = groupableTypes.has(notification.type)
        ? `${notification.type}:${notification.target_id || ''}:${notification.url || ''}`
        : `${notification.id}`;
      const group = groups.get(key) || [];
      group.push(notification);
      groups.set(key, group);
    });
    return Array.from(groups.values()).map(group => {
      const [first] = group;
      if (group.length <= 1) return { ...first, groupCount: 1 };
      const groupedLabel = resolveLabel(`notifications.grouped.${first.type}`, '');
      const message = groupedLabel
        ? `${group.length} ${resolveLabel('notifications.people', 'people')} ${groupedLabel}`
        : `${group.length} ${resolveLabel('notifications.people', 'people')} ${resolveLabel('notifications.new', 'New notification')}`;
      return {
        ...first,
        groupCount: group.length,
        message,
      };
    });
  }, [notifications, resolveLabel]);

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
              ) : groupedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-white/20 mb-3" />
                  <p className="text-sm text-white/50">
                    {t('notifications.empty') || 'Нет уведомлений'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {groupedNotifications.map((notification: Notification & { groupCount?: number }) => (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      {notification.actor_id ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => handleActorClick(event, notification)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              handleActorClick(event as unknown as React.MouseEvent, notification);
                            }
                          }}
                          className="shrink-0"
                          aria-label={notification.actor_username || 'user'}
                        >
                          <Avatar
                            src={notification.actor_avatar ? normalizeImageUrl(notification.actor_avatar) : undefined}
                            alt={notification.actor_username || 'user'}
                            size="sm"
                          />
                        </span>
                      ) : (
                        <div className="shrink-0">
                          <Avatar
                            src={notification.actor_avatar ? normalizeImageUrl(notification.actor_avatar) : undefined}
                            alt={notification.actor_username || 'user'}
                            size="sm"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-white">
                          {renderNotificationText(notification)}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      {notification.groupCount && notification.groupCount > 1 && (
                        <div className="shrink-0 text-xs text-white/60">+{notification.groupCount - 1}</div>
                      )}
                      {!notification.read && (
                        <div className="shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      )}
                    </motion.button>
                  ))}
                  {hasMore && (
                    <div className="px-4 py-2">
                      <Button
                        variant="ghost"
                        className="w-full text-xs"
                        onClick={() => fetchNotifications(offset, true)}
                        disabled={loading}
                      >
                        {loading ? t('common.loading') || 'Загрузка...' : t('notifications.load_more') || 'Показать ещё'}
                      </Button>
                    </div>
                  )}
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

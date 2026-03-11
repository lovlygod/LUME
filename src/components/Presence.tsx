import { useEffect, useState } from 'react';
import { apiRequest } from "@/services/api";
import { errorHandler } from "@/services/errorHandler";

interface PresenceProps {
  userId: string;
  showLastSeen?: boolean;
  className?: string;
}

export default function Presence({ userId, showLastSeen = true, className = '' }: PresenceProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Fetch initial presence status
    const fetchPresence = async () => {
      try {
        const data = await apiRequest<{ online: boolean; lastSeenAt?: string | null }>(
          `/users/${userId}/presence`,
          { method: "GET" }
        );
        setIsOnline(data.online);
        setLastSeen(data.online ? null : data.lastSeenAt || null);
      } catch (error) {
        errorHandler.handleApiError(error, { showToast: false });
      }
    };

    fetchPresence();

    // Listen for presence updates
    const handlePresenceUpdate = (event: CustomEvent) => {
      if (event.detail?.userId === userId) {
        setIsOnline(event.detail.online);
        if (!event.detail.online) {
          setLastSeen(event.detail.lastSeenAt);
        }
      }
    };

    // Listen for typing updates
    const handleTypingUpdate = (event: CustomEvent) => {
      if (event.detail?.userId === userId) {
        setIsTyping(event.detail.isTyping);
        
        // Auto-clear typing indicator after 3 seconds
        if (event.detail.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    window.addEventListener('presence:update', handlePresenceUpdate);
    window.addEventListener('typing:update', handleTypingUpdate);
    
    return () => {
      window.removeEventListener('presence:update', handlePresenceUpdate);
      window.removeEventListener('typing:update', handleTypingUpdate);
    };
  }, [userId]);

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Был(а) только что';
    if (diffMins < 60) return `Был(а) ${diffMins} мин. назад`;
    if (diffHours < 24) return `Был(а) ${diffHours} ч. назад`;
    if (diffDays < 7) return `Был(а) ${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Online Indicator */}
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full transition-colors ${
            isOnline ? 'bg-green-500' : 'bg-[#3f3f46]'
          }`}
        />
        {isTyping && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full animate-pulse" title="Печатает..." />
        )}
      </div>

      {/* Status Text */}
      {showLastSeen && (
        <span className="text-xs text-[#a1a1aa]">
          {isOnline ? (
            <span className="text-green-500">Онлайн</span>
          ) : (
            formatLastSeen(lastSeen)
          )}
          {isTyping && <span className="ml-1 text-purple-400 animate-pulse">печатает...</span>}
        </span>
      )}
    </div>
  );
}

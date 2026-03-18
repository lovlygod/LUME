import { motion } from "framer-motion";
import type { User } from "@/types";
import { normalizeImageUrl } from "@/lib/utils";
import { DeveloperBadge, DeveloperCrownBadge, VerifiedBadge, isDeveloper, isDeveloperCrown, isVerifiedUser } from "@/contexts/AuthContext";

interface ChatPanelProps {
  user: User | null;
  chatType?: "private" | "group" | "channel";
  memberCount?: number;
  memberCountLabel?: string;
  isOnline: boolean;
  isTyping: boolean;
  lastSeen: string | null;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
  onLeave?: () => void;
  t: (key: string, options?: Record<string, string>) => string;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 24) {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ChatPanel = ({
  user,
  chatType = "private",
  memberCount,
  memberCountLabel,
  isOnline,
  isTyping,
  lastSeen,
  onOpenProfile,
  onOpenSettings,
  onLeave,
  t,
}: ChatPanelProps) => {
  if (!user) return null;

  const isPrivate = chatType === "private";

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 border-b border-white/10 cursor-pointer transition-smooth bg-white/3 backdrop-blur-[18px]"
      onClick={() => onOpenProfile()}
    >
      <div className="relative">
        {user.avatar ? (
          <img
            src={normalizeImageUrl(user.avatar) || ""}
            alt={user.name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
            {user.name.charAt(0)}
          </div>
        )}
        {isVerifiedUser(user) && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <VerifiedBadge className="h-3.5 w-3.5" />
          </div>
        )}
        {isPrivate && (
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
              isOnline ? "bg-white" : "bg-white/40"
            }`}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-secondary font-mono truncate">
          {isPrivate ? (
            isTyping ? (
              <span className="text-white/70 italic">{t("time.typing")}</span>
            ) : isOnline ? (
              <span className="text-white/70">{t("time.online")}</span>
            ) : lastSeen ? (
              t("time.lastSeen", { time: formatTime(lastSeen) })
            ) : (
              "@" + user.username
            )
          ) : (
            <span className="text-white/70">
              {chatType === "channel"
                ? memberCountLabel || t("messages.chatTypeChannel")
                : t("messages.chatMembersCount", { count: String(memberCount || 0) })}
            </span>
          )}
        </p>
      </div>
      {isVerifiedUser(user) && <VerifiedBadge className="h-4 w-4" />}
      {isDeveloperCrown(user.username)
        ? <DeveloperCrownBadge className="h-4 w-4" />
        : isDeveloper(user.username) && <DeveloperBadge className="h-4 w-4" />
      }
      {onLeave && !isPrivate && (
        <button
          type="button"
          className="ml-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
          onClick={(event) => {
            event.stopPropagation();
            onLeave();
          }}
        >
          {t("messages.chatLeaveButton") || "Выйти"}
        </button>
      )}
      {onOpenSettings && !isPrivate && (
        <button
          type="button"
          className="ml-2 rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSettings();
          }}
        >
          {t("messages.chatSettingsButton") || "Настройки"}
        </button>
      )}
    </div>
  );
};

export default ChatPanel;

import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";
import type { Chat } from "@/types/messages";
import { normalizeImageUrl } from "@/lib/utils";
import { VerifiedBadge, isVerifiedUser } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { MessageSearch } from "./MessageSearch";
import { Loader } from "@/components/ui/Loader";

interface ChatListProps {
  chats: Chat[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseChat: () => void;
  onCreateChat: () => void;
  t: (key: string) => string;
}

const toUser = (chat: Chat): User => ({
  id: chat.id,
  email: "",
  name: chat.title || `Chat ${chat.id}`,
  username: chat.username || "",
  verified: Boolean(chat.verified),
  avatar: chat.avatar || undefined,
});

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

const ChatList = ({
  chats,
  loading,
  selectedChatId,
  onSelectChat,
  onCloseChat,
  onCreateChat,
  t,
}: ChatListProps) => (
  <motion.div
    className={`m-3 flex flex-col ${
      selectedChatId ? "w-20" : "w-[360px]"
    } transition-all duration-300 ease-in-out rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-[24px]`}
  >
    <div className="px-5 py-5">
      <div className="flex items-center justify-between">
        <motion.h2
          className="text-sm font-medium text-white/80 tracking-[0.2em]"
          initial={{ opacity: 1 }}
          animate={{ opacity: selectedChatId ? 0 : 1 }}
          style={{ display: selectedChatId ? "none" : "block" }}
        >
          {t("messages.title")}
        </motion.h2>
        <div className="flex items-center gap-2">
          {!selectedChatId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onCreateChat}
              className="p-2 rounded-full hover:bg-white/5 transition-smooth"
              aria-label={t("messages.createChatTitle") || "Создать чат"}
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          )}
          {selectedChatId && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onCloseChat}
              className="p-2 rounded-full hover:bg-white/5 transition-smooth"
            >
              ✕
            </motion.button>
          )}
        </div>
      </div>
    </div>

    {!selectedChatId && (
      <div className="px-5 pb-3">
        <MessageSearch t={t} chats={chats} />
      </div>
    )}

    <div className="flex-1 overflow-y-auto px-3 pb-3">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader size={48} />
        </div>
      ) : chats.length > 0 ? (
        chats.map((chat) => {
          const user = toUser(chat);
          return (
            <motion.div
              key={chat.id}
            onClick={() => onSelectChat(chat.routeId || chat.id)}
              className={`cursor-pointer rounded-[22px] px-3 py-3 transition-smooth ${
                selectedChatId === chat.id ? "bg-white/10" : "hover:bg-white/6"
              }`}
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={normalizeImageUrl(user.avatar) || ""}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                      {user.name?.charAt(0) || "U"}
                    </div>
                  )}
                  {isVerifiedUser(user) && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <VerifiedBadge className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {!selectedChatId && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {user.name || `Chat ${chat.id}`}
                        </p>
                        <span className="text-xs text-secondary flex-shrink-0">
                          {formatTime(chat.timestamp)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-secondary">
                        {chat.lastMessage === "Исчезающее фото"
                          ? "Исчезающее фото"
                          : chat.lastMessage || t("messages.noMessages")}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-secondary">{t("messages.noConversations")}</p>
        </div>
      )}
    </div>
  </motion.div>
);

export default ChatList;

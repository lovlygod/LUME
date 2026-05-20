import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/types";
import type { Chat } from "@/types/messages";
import { normalizeImageUrl } from "@/lib/utils";
import { VerifiedBadge, isVerifiedUser } from "@/contexts/AuthContext";
import { Plus } from "lucide-react";
import { TbHierarchy2 } from "react-icons/tb";
import { MessageSearch } from "./MessageSearch";
import { Loader } from "@/components/ui/Loader";
import { useTimeFormat } from "@/hooks/useTimeFormat";

interface ChatListProps {
  chats: Chat[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseChat: () => void;
  onCreateChat: () => void;
  t: (key: string) => string;
}

const toUser = (chat: Chat): User => {
  const isPrivate = chat.type === "private";
  const otherMember = isPrivate ? chat.members?.[0] : null;
  const resolvedName =
    (isPrivate ? otherMember?.name || otherMember?.username : chat.title) ||
    chat.title ||
    `Chat ${chat.id}`;
  const resolvedUsername =
    (isPrivate ? otherMember?.username : chat.username) ||
    chat.username ||
    "";
  const resolvedAvatar =
    (isPrivate ? otherMember?.avatar : chat.avatar) ||
    chat.avatar ||
    undefined;
  const resolvedVerified =
    isPrivate ? Boolean(otherMember?.verified) : Boolean(chat.verified);

  return {
    id: chat.id,
    email: "",
    name: resolvedName,
    username: resolvedUsername,
    verified: resolvedVerified,
    avatar: resolvedAvatar,
  };
};

const formatTime = (timestamp: string) => {
  const timeFormat = (localStorage.getItem("timeFormat") as "12h" | "24h") || "12h";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 24) {
    if (timeFormat === "24h") {
      return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
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
    } transition-all duration-300 ease-in-out rounded-3xl border border-white/10 bg-white/5`}
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
            <div className="flex items-center justify-center w-8 h-8">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={onCloseChat}
                className="text-white/60 hover:text-white text-lg leading-none transition-smooth"
              >
                ✕
              </motion.button>
            </div>
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
              className={`cursor-pointer rounded-xl px-3 py-3 transition-smooth ${
                selectedChatId === chat.id ? "bg-white/10" : "hover:bg-white/6"
              }`}
              whileHover={{ x: 2 }}
            >
              <div className={`flex items-center gap-3 ${selectedChatId ? "justify-center" : ""}`}>
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
                      {chat.projectId && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                            {chat.projectName || 'Проект'}
                          </span>
                        </div>
                      )}
                      <p className="truncate text-xs text-secondary">
                        {(() => {
                          const isDiagramType = chat.lastMessageType === "diagram";
                          const isDiagramText = /^(graph|flowchart|pie|gitGraph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|mindmap)\s/i.test(chat.lastMessage || "");
                          return (isDiagramType || isDiagramText) ? (
                            <span className="flex items-center gap-1">
                              <TbHierarchy2 className="h-3 w-3" />
                              Diagram
                            </span>
                          ) : (chat.lastMessage || t("messages.noMessages"));
                        })()}
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

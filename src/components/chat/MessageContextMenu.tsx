import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Message } from "@/types/messages";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Square } from "lucide-react";

interface MessageContextMenuProps {
  message: Message;
  position: { x: number; y: number };
  onClose: () => void;
  onReply: (message: Message) => void;
  onCopyText?: (message: Message) => void;
  onDeleteForMe?: (messageId: string) => void;
  onDeleteForAll?: (messageId: string) => void;
  onSelect?: (messageId: string) => void;
  isSelected?: boolean;
  chatType?: "private" | "group" | "channel";
  chatRole?: "owner" | "admin" | "member";
}

const MessageContextMenu = ({
  message,
  position,
  onClose,
  onReply,
  onCopyText,
  onDeleteForMe,
  onDeleteForAll,
  onSelect,
  isSelected,
  chatType = "private",
  chatRole = "member",
}: MessageContextMenuProps) => {
  const isChannel = chatType === "channel";
  const isOwner = chatRole === "owner";
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => onClose();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="fixed z-50 min-w-[160px] max-w-[220px] rounded-[16px] border border-white/10 bg-white/10 backdrop-blur-[24px] shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
      style={{ left: position.x, top: position.y }}
    >
      {(!isChannel || (chatRole === "admin" || chatRole === "owner")) && (
        <button
          type="button"
          onClick={() => {
            onReply(message);
            onClose();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-smooth rounded-t-[16px]"
        >
          {t("messages.replyAction")}
        </button>
      )}
      {onSelect && !isChannel && (
        <button
          type="button"
          onClick={() => { onSelect(message.id); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-smooth flex items-center gap-2 rounded-[16px]"
        >
          {isSelected ? <><Check className="h-4 w-4 text-cyan-400" />{t("messages.selected") || "Selected"}</> : <><Square className="h-4 w-4" />{t("messages.select") || "Select"}</>}
        </button>
      )}
      {onSelect && isChannel && isOwner && (
        <button
          type="button"
          onClick={() => { onSelect(message.id); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-smooth flex items-center gap-2 rounded-[16px]"
        >
          {isSelected ? <><Check className="h-4 w-4 text-cyan-400" />{t("messages.selected") || "Selected"}</> : <><Square className="h-4 w-4" />{t("messages.select") || "Select"}</>}
        </button>
      )}
      {onCopyText && (
        <button
          type="button"
          onClick={() => {
            onCopyText(message);
            onClose();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-smooth rounded-[16px]"
        >
          {t("messages.copyMessage")}
        </button>
      )}
      {onDeleteForMe && !isChannel && message.own && (
        <button
          type="button"
          onClick={() => {
            onDeleteForMe(message.id);
            onClose();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 transition-smooth rounded-[16px]"
        >
          {t("messages.deleteForMe")}
        </button>
      )}
      {onDeleteForAll && (!isChannel || isOwner) && message.own && (
        <button
          type="button"
          onClick={() => {
            onDeleteForAll(message.id);
            onClose();
          }}
          className="w-full px-4 py-2.5 text-left text-sm text-red-200 hover:bg-white/10 transition-smooth rounded-b-[16px]"
        >
          {t("messages.deleteForEveryone")}
        </button>
      )}
    </motion.div>
  );
};

export default MessageContextMenu;

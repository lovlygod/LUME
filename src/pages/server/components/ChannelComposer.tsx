import { useRef } from "react";
import { motion } from "framer-motion";
import { Paperclip, Send } from "lucide-react";
import type { Attachment } from "@/types/messages";
import { ChannelAttachmentsPreview } from "./ChannelAttachmentsPreview";
import { ChannelReplyBar } from "./ChannelReplyBar";
import type { ReplyPreview } from "../hooks/useReply";

interface ChannelComposerProps {
  msgText: string;
  isSending: boolean;
  attachments: Attachment[];
  replyTo: ReplyPreview | null;
  onFileSelect: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  onOpenImage: (imageId: string, src: string) => void;
  onClearReply: () => void;
  onSetMsgText: (text: string) => void;
  onSend: () => void;
  placeholder: string;
}

export const ChannelComposer = ({
  msgText,
  isSending,
  attachments,
  replyTo,
  onFileSelect,
  onRemoveAttachment,
  onOpenImage,
  onClearReply,
  onSetMsgText,
  onSend,
  placeholder,
}: ChannelComposerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-3 px-6 pb-6 bg-transparent border-0 shadow-none backdrop-blur-0">
      <ChannelAttachmentsPreview
        attachments={attachments}
        onRemove={onRemoveAttachment}
        onOpenImage={onOpenImage}
      />

      <ChannelReplyBar replyTo={replyTo} onClear={onClearReply} />

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            if (files.length > 0) {
              onFileSelect(files);
            }
            event.currentTarget.value = "";
          }}
        />
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-white/80 hover:bg-white/12 transition-smooth"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Paperclip className="h-5 w-5" />
        </motion.button>
        <input
          type="text"
          value={msgText}
          onChange={(event) => onSetMsgText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClearReply();
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          disabled={isSending}
          className="flex-1 glass-input px-5 py-3 text-sm text-white placeholder:text-white/35 disabled:opacity-50"
        />
        <motion.button
          disabled={(!msgText.trim() && attachments.length === 0) || isSending}
          onClick={onSend}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          whileHover={msgText.trim() || attachments.length > 0 ? { scale: 1.02 } : {}}
          whileTap={msgText.trim() || attachments.length > 0 ? { scale: 0.98 } : {}}
        >
          {isSending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

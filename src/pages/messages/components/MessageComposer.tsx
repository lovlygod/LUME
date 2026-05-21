import { useRef, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, X, FileImage, File, Mic, Smile, Sticker } from "lucide-react";
import StickerPicker from "@/components/stickers/StickerPicker";
import type { Sticker, StickerPack } from "@/types/stickers";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { ReplyBar } from "@/components/chat/ReplyBar";
import { ImageThumb } from "@/components/media/ImageViewer";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import type { Attachment } from "@/types/messages";
import ChatEmojiPicker from "@/components/ui/ChatEmojiPicker";

interface ReplyPreview {
  author: string;
  text?: string;
  imageUrl?: string;
}

interface MessageComposerProps {
  msgText: string;
  isSending: boolean;
  canSend?: boolean;
  readOnlyMessage?: ReactNode;
  attachments: Attachment[];
  replyTo: ReplyPreview | null;
  stickersOpen: boolean;
  myStickerPacks: StickerPack[];
  lumeStickerPacks: StickerPack[];
  stickersByPack: Record<string, Sticker[]>;
  activeStickerPackId: string | null;
  onFileSelect: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  onOpenImage: (imageId: string, src: string) => void;
  onClearReply: () => void;
  onSetMsgText: (text: string) => void;
  onSend: () => void;
  onSendVoice: (blob: Blob, duration: number) => void;
  onToggleStickers: () => void;
  onSelectSticker: (sticker: Sticker) => void;
  onPickStickerPack: (packId: string) => void;
  onBrowseStickerPacks: () => void;
  t: (key: string) => string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

const MessageComposer = ({
  msgText,
  isSending,
  canSend = true,
  readOnlyMessage,
  attachments,
  replyTo,
  stickersOpen,
  myStickerPacks,
  lumeStickerPacks,
  stickersByPack,
  activeStickerPackId,
  onFileSelect,
  onRemoveAttachment,
  onOpenImage,
  onClearReply,
  onSetMsgText,
  onSend,
  onSendVoice,
  onToggleStickers,
  onSelectSticker,
  onPickStickerPack,
  onBrowseStickerPacks,
  t,
}: MessageComposerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPopoverRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (!msgText && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [msgText]);

  useEffect(() => {
  if (!isSending && textareaRef.current) {
    textareaRef.current.focus();
    }
  }, [isSending]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onSetMsgText(msgText + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = msgText.substring(0, start) + emoji + msgText.substring(end);
    onSetMsgText(newText);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowEmojiPicker(false);
    };

    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (emojiButtonRef.current?.contains(target)) return;
      if (emojiPopoverRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutsideClick, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutsideClick, true);
    };
  }, [showEmojiPicker]);

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        const message = t("messages.fileTooLarge")
          .replace("{filename}", file.name)
          .replace("{maxSize}", "25MB") || `Файл "${file.name}" слишком большой. Максимальный размер: 25MB`;
        toast.error(message);
        return;
      }

      const isAllowedType = ALLOWED_FILE_TYPES.some(
        (type) => file.type === type || file.type.startsWith(type.split("/")[0] + "/")
      );

      if (!isAllowedType) {
        const message = t("messages.fileTypeNotSupported")
          .replace("{filename}", file.name) || `Тип файла "${file.name}" не поддерживается`;
        toast.error(message);
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  }, [t]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      fileRejections.forEach((rejection) => {
        const { file, errors } = rejection;
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            const message =
              t("messages.fileTooLarge")
                .replace("{filename}", file.name)
                .replace("{maxSize}", "25MB") ||
              `Файл "${file.name}" слишком большой. Максимальный размер: 25MB`;
            toast.error(message);
          } else if (error.code === "file-invalid-type") {
            const message =
              t("messages.fileTypeNotSupported")
                .replace("{filename}", file.name) ||
              `Тип файла "${file.name}" не поддерживается`;
            toast.error(message);
          }
        });
      });

      const validFiles = validateFiles(acceptedFiles);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    },
    [onFileSelect, validateFiles, t]
  );

  const { getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      "image/*": ALLOWED_IMAGE_EXTENSIONS,
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/zip": [".zip"],
      "application/x-rar-compressed": [".rar"],
      "application/x-7z-compressed": [".7z"],
    },
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    noKeyboard: true,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <FileImage className="h-6 w-6 text-white/60" />;
    }
    return <File className="h-6 w-6 text-white/60" />;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
        file.type.startsWith("image/") || ALLOWED_FILE_TYPES.some((type) => file.type === type || file.type.startsWith(type.split("/")[0] + "/"))
      );
      if (files.length > 0) {
        const validFiles = validateFiles(files);
        if (validFiles.length > 0) {
          onFileSelect(validFiles);
        }
      }
    },
    [onFileSelect, validateFiles]
  );

  if (!canSend) {
    return (
      <div className="mt-3 px-6 pb-6 bg-transparent border-0 shadow-none backdrop-blur-0 relative">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          {readOnlyMessage ?? (t("messages.channelReadOnly") || "Только админы могут писать в канале.")}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            ref={emojiPopoverRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-full left-0 right-0 mb-2 z-50 px-6"
            data-emoji-picker
          >
            <ChatEmojiPicker onEmojiClick={insertEmoji} />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="mt-3 px-6 pb-6 bg-transparent border-0 shadow-none backdrop-blur-0 relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} />

        <StickerPicker
          isOpen={stickersOpen}
          activePackId={activeStickerPackId}
          myPacks={myStickerPacks}
          lumePacks={lumeStickerPacks}
          stickersByPack={stickersByPack}
          onSelect={onSelectSticker}
          onPickPack={onPickStickerPack}
          onBrowsePacks={onBrowseStickerPacks}
        />

        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-[28px] border-2 border-dashed border-white/40"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4"
                >
                  <FileImage className="h-8 w-8 text-white" />
                </motion.div>
                <p className="text-lg font-semibold text-white mb-1">
                  {t("messages.dropFiles") || "Перетащите файлы сюда"}
                </p>
                <p className="text-sm text-white/60">
                  {t("messages.dropFilesHint") || "Изображения и документы до 25MB"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {attachments.map((att, idx) => (
              <div key={att.id} className="relative flex-shrink-0 group">
                {att.type === "image" ? (
                  <ImageThumb
                    imageId={`dm-upload-${att.id}`}
                    src={att.url}
                    alt="attachment"
                    className="h-20 w-20 object-cover rounded-2xl border border-white/10"
                    onOpen={(imageId, src) => onOpenImage(imageId, src)}
                  />
                ) : (
                  <div className="h-20 w-20 flex flex-col items-center justify-center gap-1 bg-white/5 rounded-2xl border border-white/10 p-1">
                    {getFileIcon(att.mime)}
                    <span className="text-[8px] text-white/50 truncate w-full text-center">
                      {formatFileSize(att.size)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => onRemoveAttachment(idx)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth hover:bg-white/30"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {replyTo && (
          <ReplyBar
            author={replyTo.author}
            text={replyTo.text}
            imageUrl={replyTo.imageUrl}
            onClose={onClearReply}
          />
        )}

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            ref={emojiButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker((prev) => !prev);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-smooth ${
              showEmojiPicker
                ? 'bg-white/15 text-white'
                : 'bg-white/6 text-white/80 hover:bg-white/12'
            }`}
          >
            <Smile className="h-5 w-5" />
          </motion.button>

          <motion.button
            type="button"
            onClick={onToggleStickers}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-white/80 hover:bg-white/12 transition-smooth"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sticker className="h-5 w-5" />
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z"
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (files.length > 0) {
                const validFiles = validateFiles(files);
                if (validFiles.length > 0) {
                  onFileSelect(validFiles);
                }
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

          <textarea
            ref={(el) => {
              textareaRef.current = el;
              if (el) el.scrollTop = el.scrollHeight;
            }}
            value={msgText}
            onChange={(event) => onSetMsgText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                if (showEmojiPicker) {
                  setShowEmojiPicker(false);
                  return;
                }
                onClearReply();
              }
              if (event.key === "Enter") {
                if (event.shiftKey) {
                  return;
                }
                event.preventDefault();
                onSend();
              }
            }}
            placeholder={t("messages.sendMessage")}
            disabled={isSending}
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 disabled:opacity-50 resize-none overflow-y-auto min-h-[48px] max-h-[200px] focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 200) + "px";
              target.scrollTop = target.scrollHeight;
            }}
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

          <VoiceRecorder
            onSendVoice={onSendVoice}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;

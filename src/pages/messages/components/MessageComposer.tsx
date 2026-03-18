import { useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, X, FileImage, File, Mic, Smile } from "lucide-react";
import StickerPicker from "@/components/stickers/StickerPicker";
import type { Sticker, StickerPack } from "@/types/stickers";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { ReplyBar } from "@/components/chat/ReplyBar";
import { ImageThumb } from "@/components/media/ImageViewer";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import type { Attachment } from "@/types/messages";

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
  momentToggle: boolean;
  momentPreview: string | null;
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
  onToggleMoment: () => void;
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
  momentToggle,
  momentPreview,
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
  onToggleMoment,
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

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    
    files.forEach((file) => {
      // Проверка размера
      if (file.size > MAX_FILE_SIZE) {
        const message = t("messages.fileTooLarge")
          .replace("{filename}", file.name)
          .replace("{maxSize}", "25MB") || `Файл "${file.name}" слишком большой. Максимальный размер: 25MB`;
        toast.error(message);
        return;
      }

      // Проверка типа файла
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
      // Обработка отклоненных файлов
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

      // Валидация и загрузка принятых файлов
      const validFiles = validateFiles(acceptedFiles);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    },
    [onFileSelect, validateFiles, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
    <div
      className="mt-3 px-6 pb-6 bg-transparent border-0 shadow-none backdrop-blur-0 relative"
      {...getRootProps()}
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

      {/* Drag Overlay */}
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

      {/* Moment Preview */}
      {momentPreview && (
        <div className="mb-3">
          <div className="relative w-24">
            <img
              src={momentPreview}
              alt="moment-preview"
              className="h-24 w-24 rounded-2xl border border-white/10 object-cover blur-[18px] saturate-90 contrast-105"
              draggable={false}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs text-white/80">
              Исчезающее фото
            </div>
            <button
              onClick={onToggleMoment}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Attachments Preview */}
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

      {/* Reply Bar */}
      {replyTo && (
        <ReplyBar
          author={replyTo.author}
          text={replyTo.text}
          imageUrl={replyTo.imageUrl}
          onClose={onClearReply}
        />
      )}

      {/* Composer Input */}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onToggleStickers}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-white/80 hover:bg-white/12 transition-smooth"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Smile className="h-5 w-5" />
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
        <button
          type="button"
          onClick={onToggleMoment}
          className={`h-9 rounded-full border px-3 text-[11px] font-semibold leading-tight transition-smooth ${
            momentToggle
              ? "border-white/20 bg-white/15 text-white"
              : "border-white/10 bg-white/5 text-white/70 hover:text-white"
          }`}
        >
          Исчезающее
          <span className="block">фото</span>
        </button>
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
          placeholder={momentToggle ? "Описание не требуется" : t("messages.sendMessage")}
          disabled={isSending || momentToggle}
          className="flex-1 glass-input px-5 py-3 text-sm text-white placeholder:text-white/35 disabled:opacity-50"
        />
        <motion.button
          disabled={(!msgText.trim() && attachments.length === 0 && !momentPreview) || isSending}
          onClick={onSend}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          whileHover={msgText.trim() || attachments.length > 0 || momentPreview ? { scale: 1.02 } : {}}
          whileTap={msgText.trim() || attachments.length > 0 || momentPreview ? { scale: 0.98 } : {}}
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
  );
};

export default MessageComposer;

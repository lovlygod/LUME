import { useEffect } from "react";
import { X } from "lucide-react";
import { normalizeImageUrl } from "@/lib/utils";

interface ReplyBarProps {
  author: string;
  text?: string;
  imageUrl?: string;
  onClose: () => void;
}

export const ReplyBar: React.FC<ReplyBarProps> = ({
  author,
  text,
  imageUrl,
  onClose,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="mb-3 flex items-center justify-between rounded-[18px] border border-white/10 bg-white/6 px-4 py-2 text-xs text-white/70">
      <div className="flex items-center gap-3 min-w-0">
        {imageUrl && (
          <img
            src={normalizeImageUrl(imageUrl)}
            alt="reply"
            className="h-7 w-7 rounded-[10px] object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Ответ</div>
          <div className="truncate text-white/85">{author}</div>
          <div className="truncate text-white/60">{text || "Вложение"}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-3 h-7 w-7 rounded-full border border-white/10 text-white/60 hover:bg-white/10 transition-smooth"
      >
        <X className="h-4 w-4 mx-auto" />
      </button>
    </div>
  );
};

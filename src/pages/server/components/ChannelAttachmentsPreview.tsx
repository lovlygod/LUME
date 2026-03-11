import { Paperclip, X } from "lucide-react";
import { ImageThumb } from "@/components/media/ImageViewer";
import type { Attachment } from "@/types/messages";

interface ChannelAttachmentsPreviewProps {
  attachments: Attachment[];
  onRemove: (index: number) => void;
  onOpenImage: (imageId: string, src: string) => void;
}

export const ChannelAttachmentsPreview = ({
  attachments,
  onRemove,
  onOpenImage,
}: ChannelAttachmentsPreviewProps) => {
  if (attachments.length === 0) return null;
  return (
    <div className="flex gap-2 mb-3 overflow-x-auto">
      {attachments.map((att, idx) => (
        <div key={att.id} className="relative flex-shrink-0 group">
          {att.type === "image" ? (
            <ImageThumb
              imageId={`server-upload-${att.id}`}
              src={att.url}
              alt="attachment"
              className="h-20 w-20 object-cover rounded-2xl border border-white/10"
              onOpen={(imageId, src) => onOpenImage(imageId, src)}
            />
          ) : (
            <div className="h-20 w-20 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
              <Paperclip className="h-6 w-6 text-white/60" />
            </div>
          )}
          <button
            onClick={() => onRemove(idx)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

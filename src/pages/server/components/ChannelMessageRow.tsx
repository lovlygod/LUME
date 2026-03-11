import { useEffect } from "react";
import type { ServerMessage } from "@/types";
import { CheckCheck, Paperclip } from "lucide-react";
import { ImageThumb } from "@/components/media/ImageViewer";
import LinkPreview from "@/components/LinkPreview";
import { renderSafeTextWithLinks } from "../lib/messageText";

interface ChannelMessageRowProps {
  msg: ServerMessage & {
    deletedForMe?: boolean;
    deletedForAll?: boolean;
    replyToMessageId?: string | null;
  };
  own: boolean;
  highlighted: boolean;
  replyTarget?: (ServerMessage & { replyToMessageId?: string | null }) | null;
  replyAuthor: string;
  replyThumb?: string | null;
  onReply: (msg: ServerMessage) => void;
  onReplyJump: (messageId: string) => void;
  onDeleteRequest: (messageId: string, x: number, y: number) => void;
  onOpenImage: (imageId: string, src: string) => void;
}

export const ChannelMessageRow = ({
  msg,
  own,
  highlighted,
  replyTarget,
  replyAuthor,
  replyThumb,
  onReply,
  onReplyJump,
  onDeleteRequest,
  onOpenImage,
}: ChannelMessageRowProps) => {
  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, []);

  return (
    <div
      className={`flex w-full pb-1.5 ${own ? "justify-end" : "justify-start"}`}
      onDoubleClick={() => onReply(msg)}
      onContextMenu={(event) => {
        event.preventDefault();
        if (own) {
          onDeleteRequest(msg.id, event.clientX, event.clientY);
        }
      }}
    >
      <div
        className={`relative w-fit break-words rounded-[20px] border border-white/10 bg-white/5 ${
          highlighted ? "ring-1 ring-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" : ""
        } ${
          msg.attachments && msg.attachments.some((a) => a.type === "image")
            ? "p-1.5"
            : "px-3 py-1.5"
        } max-w-[min(560px,65%)]`}
      >
        {replyTarget && (
          <button
            type="button"
            onClick={() => onReplyJump(replyTarget.id)}
            className="mb-2 flex items-center gap-2 rounded-[16px] bg-white/[0.035] px-3 py-1.5 transition-smooth hover:bg-white/[0.06] min-w-0 max-w-full"
          >
            <div className="h-8 w-[3px] flex-shrink-0 rounded-full bg-white/20" />
            {replyThumb && (
              <img
                src={replyThumb}
                alt="reply"
                className="h-8 w-8 flex-shrink-0 rounded-[10px] object-cover"
              />
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="text-[10px] tracking-[0.18em] uppercase text-white/45">Ответ</div>
              <div className="text-[13px] font-semibold text-white/80 leading-none truncate overflow-hidden text-ellipsis">
                {replyAuthor}
              </div>
              <div className="text-[12px] text-white/55 truncate overflow-hidden text-ellipsis max-w-full">
                {replyTarget.text || (replyTarget.attachments?.length ? "Вложение" : "")}
              </div>
            </div>
          </button>
        )}
        <div className="text-sm text-white/90">
          {msg.attachments && msg.attachments.length > 0 ? (
            <div className="flex flex-col gap-2">
              {msg.attachments.map((att) => (
                <div key={att.id} className="relative">
                  {att.type === "image" ? (
                    <ImageThumb
                      imageId={`server-${msg.id}-${att.id}`}
                      src={att.url}
                      alt="attachment"
                      className="block max-h-[220px] w-full max-w-full rounded-[16px] border border-white/10 object-cover hover:opacity-85 transition-smooth"
                      onOpen={(imageId, src) => onOpenImage(imageId, src)}
                      onLoad={() => window.dispatchEvent(new Event("resize"))}
                    />
                  ) : (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-white/6 hover:bg-white/10 transition-smooth"
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="text-xs truncate max-w-[180px]">
                        {att.url.split("/").pop()}
                      </span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {msg.text && msg.text.trim() && (
            <div
              className={`${
                msg.attachments && msg.attachments.some((a) => a.type === "image") ? "px-3 pt-2" : ""
              }`}
            >
              <p className="break-words whitespace-pre-wrap leading-[1.25]">
                {renderSafeTextWithLinks(msg.text)}
              </p>
            </div>
          )}
          {msg.linkPreview && (
            <div className={`${msg.attachments && msg.attachments.some((a) => a.type === "image") ? "px-3" : ""}`}>
              <LinkPreview preview={msg.linkPreview} />
            </div>
          )}
        </div>
        <div
          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] leading-none text-white/45 ${
            msg.attachments && msg.attachments.some((a) => a.type === "image") ? "px-3 pb-2" : ""
          }`}
        >
          <span>
            {new Date(msg.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {own && <CheckCheck className="h-3.5 w-3.5 text-white/45" />}
        </div>
      </div>
    </div>
  );
};

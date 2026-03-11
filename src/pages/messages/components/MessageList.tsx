import { useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { User } from "@/types";
import type { Attachment, Message } from "@/types/messages";
import { ImageThumb } from "@/components/media/ImageViewer";
import { Paperclip, CheckCheck } from "lucide-react";
import LinkPreview from "@/components/LinkPreview";
import VoiceMessagePlayer from "@/components/chat/VoiceMessagePlayer";
import { renderSafeTextWithLinks } from "../lib/messageText";

interface ReplyPreview {
  id: string;
  author: string;
  text?: string;
  imageUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  selectedChatUser: User | null;
  highlightedMessageId: string | null;
  onReply: (msg: Message) => void;
  onReplyJump: (messageId: string) => void;
  onDeleteRequest: (messageId: string, x: number, y: number) => void;
  onOpenMoment: (msg: Message) => void;
  momentOpenMap: Record<string, string>;
  momentLoadingMap: Record<string, boolean>;
  momentBlockedMap: Record<string, boolean>;
  onCloseMoment: (messageId: string) => void;
  onOpenImage: (imageId: string, src: string) => void;
  activeImageId: string | null;
  activeImageSrc: string | null;
  onCloseImage: () => void;
  onLoadMore: () => void;
}

const MessageList = ({
  messages,
  currentUser,
  selectedChatUser,
  highlightedMessageId,
  onReply,
  onReplyJump,
  onDeleteRequest,
  onOpenMoment,
  momentOpenMap,
  momentLoadingMap,
  momentBlockedMap,
  onCloseMoment,
  onOpenImage,
  activeImageId,
  activeImageSrc,
  onCloseImage,
  onLoadMore,
}: MessageListProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const stickToBottomRef = useRef(true);

  const visibleMessages = useMemo(
    () => messages.filter((msg) => !msg.deletedForAll && !msg.deletedForMe),
    [messages]
  );

  const rowVirtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 8,
    getItemKey: (index) => visibleMessages[index]?.id ?? index,
  });

  useEffect(() => {
    const scrollEl = parentRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - (scrollEl.scrollTop + scrollEl.clientHeight);
      stickToBottomRef.current = distanceFromBottom < 80;
      if (scrollEl.scrollTop < 40) {
        const prevHeight = scrollEl.scrollHeight;
        onLoadMore();
        requestAnimationFrame(() => {
          const newHeight = scrollEl.scrollHeight;
          scrollEl.scrollTop = newHeight - prevHeight + scrollEl.scrollTop;
        });
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [onLoadMore]);

  useEffect(() => {
    const scrollEl = parentRef.current;
    if (!scrollEl) return;
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    if (!lastMessage) return;

    if (lastMessageIdRef.current && lastMessage.id !== lastMessageIdRef.current && stickToBottomRef.current) {
      requestAnimationFrame(() => {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      });
    }
    lastMessageIdRef.current = lastMessage.id;
  }, [visibleMessages]);

  const totalSize = rowVirtualizer.getTotalSize();
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="flex-1 h-full overflow-y-auto px-5 py-6 md:px-8 min-h-0 space-y-4 mb-3">
      <div style={{ height: totalSize, position: "relative" }}>
        {virtualItems.map((virtualRow) => {
          const msg = visibleMessages[virtualRow.index];
          if (!msg) return null;
          const replyTarget = msg.replyToMessageId
            ? messages.find((m) => m.id === msg.replyToMessageId)
            : null;
          const replyAuthor = replyTarget
            ? replyTarget.own
              ? currentUser?.name || "You"
              : selectedChatUser?.name || "User"
            : "";
          const replyThumb = replyTarget?.type === "moment_image"
            ? replyTarget?.moment?.thumbDataUrl || undefined
            : replyTarget?.attachments?.find((att) => att.type === "image")?.url;
          const hasVoiceAttachment = Boolean(msg.attachments?.some((att) => att.type === "voice"));
          const isVoiceMessage = msg.type === "voice" || hasVoiceAttachment;

          return (
            <div
              key={msg.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className={`flex w-full pb-3 ${msg.own ? "justify-end" : "justify-start"}`}
              onDoubleClick={() => onReply(msg)}
              onContextMenu={(event) => {
                event.preventDefault();
                if (msg.own) {
                  onDeleteRequest(msg.id, event.clientX, event.clientY);
                }
              }}
            >
              <div
                className={`relative w-fit break-words rounded-[20px] border border-white/10 bg-white/5 ${
                  highlightedMessageId === msg.id
                    ? "ring-1 ring-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                    : ""
                } ${
                  msg.type === "moment_image"
                    ? "min-w-[240px] max-w-[min(420px,65%)]"
                    : "max-w-[min(560px,65%)]"
                } ${
                  msg.type === "moment_image" ||
                  (msg.attachments && msg.attachments.some((a) => a.type === "image"))
                    ? "p-1.5"
                    : "px-3 py-1.5"
                }`}
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
                        {replyTarget.type === "moment_image"
                          ? "Исчезающее фото"
                          : replyTarget.text ||
                            (replyTarget.attachments?.length ? "Вложение" : "")}
                      </div>
                    </div>
                  </button>
                )}
                <div className="text-sm text-white/90">
                  {msg.type === "moment_image" && msg.moment ? (
                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                      <button
                        type="button"
                        className="relative w-full text-left"
                        onClick={() => onOpenMoment(msg)}
                        disabled={
                          momentLoadingMap[msg.id] ||
                          !!msg.moment?.viewedAt ||
                          !!momentBlockedMap[msg.id]
                        }
                      >
                        <div className="relative w-full aspect-square rounded-[20px] overflow-hidden border border-white/10 bg-white/5">
                          <img
                            src={msg.moment.thumbDataUrl || ""}
                            alt="moment"
                            className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-80"
                            draggable={false}
                            onContextMenu={(event) => event.preventDefault()}
                          />
                          <div className="absolute inset-0 bg-black/45" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <div className="text-[11px] tracking-[0.18em] uppercase text-white/55">
                              ФОТО-МОМЕНТ
                            </div>
                            {!msg.moment.viewedAt && !momentBlockedMap[msg.id] ? (
                              <div className="mt-3 rounded-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/15 text-[13px] font-medium text-white/90">
                                Открыть (1 раз)
                              </div>
                            ) : momentBlockedMap[msg.id] ? (
                              <div className="mt-3 rounded-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/15 text-[13px] font-medium text-white/90">
                                Недоступно
                              </div>
                            ) : (
                              <div className="mt-3 rounded-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/15 text-[13px] font-medium text-white/90">
                                Просмотрено
                              </div>
                            )}
                            {!msg.moment.viewedAt && !momentBlockedMap[msg.id] && (
                              <div className="mt-1 text-[12px] text-white/40">Без сохранения</div>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : null}
                  {msg.attachments && msg.attachments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {msg.attachments.map((att: Attachment) => (
                        <div key={att.id} className="relative">
                          {att.type === "image" ? (
                            <ImageThumb
                              imageId={`dm-${msg.id}-${att.id}`}
                              src={att.url}
                              alt="attachment"
                              className="block max-h-[220px] w-full max-w-full rounded-[16px] border border-white/10 object-cover hover:opacity-85 transition-smooth"
                              onOpen={(imageId, src) => onOpenImage(imageId, src)}
                            />
                          ) : att.type === "voice" ? (
                            <div className="px-3 py-2">
                              <VoiceMessagePlayer
                                audioUrl={att.url}
                                duration={att.duration}
                                timestamp={msg.timestamp}
                              />
                            </div>
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
                  {msg.text && msg.text.trim() && msg.type !== "moment_image" && !isVoiceMessage && (
                    <div className={`${msg.attachments && msg.attachments.some((a) => a.type === "image") ? "px-3 pt-2" : ""}`}>
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
                {!isVoiceMessage && (
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] leading-none text-white/45 ${
                      msg.attachments && msg.attachments.some((a) => a.type === "image")
                        ? "px-3 pb-2"
                        : ""
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {msg.own && <CheckCheck className="h-3.5 w-3.5 text-white/45" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageList;

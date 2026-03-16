import { useCallback, useEffect, useMemo, useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { User } from "@/types";
import type { ServerMessage } from "@/types";
import { ChannelMessageRow } from "./ChannelMessageRow";
import { isNearBottom, keepScrollPosition } from "../lib/scroll";

interface ChannelMessageListProps {
  messages: Array<ServerMessage & { deletedForMe?: boolean; deletedForAll?: boolean; replyToMessageId?: string | null }>;
  currentUser: User | null;
  highlightedMessageId: string | null;
  scrollToMessageId?: string | null;
  scrollToMessageNonce?: number;
  onReply: (msg: ServerMessage) => void;
  onReplyJump: (messageId: string) => void;
  onDeleteRequest: (messageId: string, x: number, y: number) => void;
  onOpenImage: (imageId: string, src: string) => void;
  onLoadMore: () => void;
  loading: boolean;
  emptyLabel: string;
  emptySubLabel?: string;
}

interface ChannelMessageItemProps {
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

const ChannelMessageItem = memo(({
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
}: ChannelMessageItemProps) => {
  return (
    <ChannelMessageRow
      msg={msg}
      own={own}
      highlighted={highlighted}
      replyTarget={replyTarget}
      replyAuthor={replyAuthor}
      replyThumb={replyThumb}
      onReply={onReply}
      onReplyJump={onReplyJump}
      onDeleteRequest={onDeleteRequest}
      onOpenImage={onOpenImage}
    />
  );
});

ChannelMessageItem.displayName = "ChannelMessageItem";

export const ChannelMessageList = ({
  messages,
  currentUser,
  highlightedMessageId,
  scrollToMessageId,
  scrollToMessageNonce,
  onReply,
  onReplyJump,
  onDeleteRequest,
  onOpenImage,
  onLoadMore,
  loading,
  emptyLabel,
  emptySubLabel,
}: ChannelMessageListProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const stickToBottomRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const visibleMessages = useMemo(
    () => messages.filter((msg) => !msg.deletedForAll && !msg.deletedForMe),
    [messages]
  );

  const messagesCount = visibleMessages.length;
  const currentUserId = currentUser?.id;

  const rowVirtualizer = useVirtualizer({
    count: messagesCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const handleScroll = useCallback(() => {
    const scrollEl = parentRef.current;
    if (!scrollEl) return;

    stickToBottomRef.current = isNearBottom(scrollEl);

    if (scrollEl.scrollTop < 50 && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      const prevHeight = scrollEl.scrollHeight;
      onLoadMore();
      requestAnimationFrame(() => {
        keepScrollPosition(scrollEl, prevHeight);
        isLoadingMoreRef.current = false;
      });
    }
  }, [onLoadMore]);

  useEffect(() => {
    const scrollEl = parentRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleAutoScroll = useCallback(() => {
    const scrollEl = parentRef.current;
    if (!scrollEl || !stickToBottomRef.current) return;
    requestAnimationFrame(() => {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  }, []);

  useEffect(() => {
    const scrollEl = parentRef.current;
    if (!scrollEl) return;
    
    if (!hasInitializedRef.current && visibleMessages.length > 0) {
      requestAnimationFrame(() => {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      });
      hasInitializedRef.current = true;
      const lastMessage = visibleMessages[visibleMessages.length - 1];
      lastMessageIdRef.current = lastMessage?.id || null;
      return;
    }

    const lastMessage = visibleMessages[messagesCount - 1];
    if (!lastMessage) return;

    if (lastMessageIdRef.current && lastMessage.id !== lastMessageIdRef.current) {
      handleAutoScroll();
    }
    lastMessageIdRef.current = lastMessage.id;
  }, [messagesCount, visibleMessages, handleAutoScroll]);

  useEffect(() => {
    if (!scrollToMessageId) return;
    const targetIndex = visibleMessages.findIndex((msg) => msg.id === scrollToMessageId);
    if (targetIndex === -1) return;
    rowVirtualizer.scrollToIndex(targetIndex, { align: "center" });
  }, [scrollToMessageId, scrollToMessageNonce, visibleMessages, rowVirtualizer]);

  useEffect(() => {
    if (stickToBottomRef.current && messagesCount > 0) {
      handleAutoScroll();
    }
  }, [messagesCount, handleAutoScroll]);

  const getMessageItemProps = useCallback((msg: typeof visibleMessages[0]) => {
    const replyTarget = msg.replyToMessageId
      ? messages.find((m) => m.id === msg.replyToMessageId)
      : null;
    const replyAuthor = replyTarget?.author?.name || replyTarget?.author?.username || "User";
    const replyThumb = replyTarget?.attachments?.find((att) => att.type === "image")?.url || null;
    const own = String(msg.userId) === String(currentUserId);

    return { msg, own, replyTarget, replyAuthor, replyThumb };
  }, [messages, currentUserId]);

  if (loading) {
    return (
      <div className="flex-1 h-full overflow-y-auto px-5 py-6 md:px-8 min-h-0 mb-3">
        <div className="flex items-center justify-center h-full text-secondary">Загрузка...</div>
      </div>
    );
  }

  if (visibleMessages.length === 0) {
    return (
      <div className="flex-1 h-full overflow-y-auto px-5 py-6 md:px-8 min-h-0 mb-3">
        <div className="flex flex-col items-center justify-center h-full text-secondary">
          <p className="text-sm">{emptyLabel}</p>
          {emptySubLabel ? <p className="text-xs mt-1">{emptySubLabel}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 h-full overflow-y-auto px-5 py-3 md:px-8 min-h-0 mb-2">
      <div
        style={{
          height: totalSize,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const msg = visibleMessages[virtualRow.index];
          if (!msg) return null;
          const { msg: msgData, own, replyTarget, replyAuthor, replyThumb } = getMessageItemProps(msg);

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
              className="flex w-full pb-3"
            >
              <ChannelMessageItem
                msg={msgData}
                own={own}
                highlighted={highlightedMessageId === msg.id}
                replyTarget={replyTarget}
                replyAuthor={replyAuthor}
                replyThumb={replyThumb}
                onReply={onReply}
                onReplyJump={onReplyJump}
                onDeleteRequest={onDeleteRequest}
                onOpenImage={onOpenImage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

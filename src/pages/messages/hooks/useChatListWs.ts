import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Attachment, Chat, Message } from "@/types/messages";
import { wsService } from "@/services/websocket";
import { messageQueryKeys } from "./queryKeys";

type IncomingMessage = {
  id: string | number;
  senderId: string | number;
  chatId: string | number;
  text: string;
  timestamp: string;
  type?: "text" | "media_image" | "sticker";
  media?: Message["media"];
  attachments?: Attachment[];
  replyToMessageId?: string | null;
  sticker?: Message["sticker"] | null;
  linkPreview?: Message["linkPreview"] | null;
  sender?: Message["sender"] | null;
};

export const useChatListWs = (params: {
  currentUserId?: string;
  selectedChatId?: string | null;
  chatIds?: string[];
}) => {
  const queryClient = useQueryClient();
  const subscribedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextIds = new Set((params.chatIds || []).filter(Boolean).map((id) => String(id)));
    const prevIds = subscribedIdsRef.current;

    nextIds.forEach((id) => {
      if (!prevIds.has(id)) wsService.subscribeChat(id);
    });

    prevIds.forEach((id) => {
      if (!nextIds.has(id)) wsService.unsubscribeChat(id);
    });

    subscribedIdsRef.current = nextIds;
  }, [params.chatIds]);

  useEffect(() => {
    return () => {
      subscribedIdsRef.current.forEach((id) => wsService.unsubscribeChat(id));
      subscribedIdsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleIncomingMessage = (data: IncomingMessage) => {
      const chatsKey = messageQueryKeys.chatList();

      queryClient.setQueryData<{ chats: Chat[] }>(chatsKey, (prev) => {
        if (!prev?.chats) return prev;

        const isActiveChat = String(params.selectedChatId) === String(data.chatId);
        const isOwn = String(data.senderId) === String(params.currentUserId);

        const exists = prev.chats.find((chat) => String(chat.id) === String(data.chatId));
        if (!exists) {
          return {
            chats: [
              {
                id: String(data.chatId),
                type: "private",
                title: undefined,
                avatar: undefined,
                lastMessage: data.text,
                timestamp: data.timestamp,
                unread: isOwn ? 0 : (isActiveChat ? 0 : 1),
              },
              ...prev.chats,
            ],
          };
        }

        const updated = prev.chats.map((chat) =>
          String(chat.id) === String(data.chatId)
            ? {
                ...chat,
                lastMessage: data.text,
                timestamp: data.timestamp,
                unread: isOwn ? chat.unread : isActiveChat ? 0 : (chat.unread || 0) + 1,
              }
            : chat
        );

        return {
          chats: updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        };
      });
    };

    const unsubNew = wsService.on("new_message", handleIncomingMessage);
    const unsubMedia = wsService.on("media_image", handleIncomingMessage);
    const unsubDiagram = wsService.on("diagram", handleIncomingMessage);

    return () => {
      unsubNew();
      unsubMedia();
      unsubDiagram();
    };
  }, [params.currentUserId, params.selectedChatId, queryClient]);
};


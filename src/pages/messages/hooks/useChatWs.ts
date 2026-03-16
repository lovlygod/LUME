import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Attachment, Chat, Message } from "@/types/messages";
import { wsService } from "@/services/websocket";
import { messageSounds } from "@/services/messageSounds";
import { messageQueryKeys } from "./queryKeys";

const ensureMessageShape = (data: {
  id: string | number;
  senderId: string | number;
  receiverId: string | number;
  text: string;
  timestamp: string;
  type?: "text" | "moment_image" | "sticker";
  moment?: Message["moment"];
  attachments?: Attachment[];
  replyToMessageId?: string | null;
  sticker?: Message["sticker"] | null;
}): Message => ({
  id: data.id.toString(),
  senderId: String(data.senderId),
  text: data.text,
  type: data.type || "text",
  moment: data.moment || null,
  sticker: data.sticker || null,
  timestamp: data.timestamp,
  own: false,
  attachments: data.attachments || [],
  replyToMessageId: data.replyToMessageId || null,
});

export const useChatWs = (params: {
  currentUserId?: string;
  selectedChatId?: string | null;
  onTyping?: (isTyping: boolean) => void;
  onPresence?: (online: boolean, lastSeenAt?: string | null) => void;
  onReadReceipt?: (data: { chatId: string; userId: string; lastReadMessageId: string }) => void;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const newMessageUnsub = wsService.on(
      "new_message",
      (data: {
        id: string | number;
        senderId: string | number;
        receiverId: string | number;
        text: string;
        timestamp: string;
        type?: "text" | "moment_image" | "sticker";
        moment?: Message["moment"];
        attachments?: Attachment[];
        replyToMessageId?: string | null;
        sticker?: Message["sticker"] | null;
      }) => {
        const message = ensureMessageShape(data);
        const isIncoming = String(data.senderId) !== String(params.currentUserId);
        if (isIncoming) {
          messageSounds.playReceive();
        }
        const otherUserId =
          String(data.senderId) === String(params.currentUserId)
            ? String(data.receiverId)
            : String(data.senderId);
        const chatKey = messageQueryKeys.chatMessages(otherUserId);
        const chatsKey = messageQueryKeys.chatList();

        queryClient.setQueryData<{ messages: Message[] }>(chatKey, (prev) => {
          const list = prev?.messages || [];
          if (list.some((msg) => msg.id === message.id)) return prev ?? { messages: list };
          return {
            messages: [
              ...list,
              {
                ...message,
                own: String(data.senderId) === String(params.currentUserId),
                linkPreview: message.linkPreview ?? null,
              },
            ],
          };
        });

        queryClient.setQueryData<{ chats: Chat[] }>(chatsKey, (prev) => {
          if (!prev?.chats) return prev;
          const exists = prev.chats.find((chat) => String(chat.userId) === String(otherUserId));
          if (!exists) {
            return {
              chats: [
                {
                  id: `${Date.now()}`,
                  userId: otherUserId,
                  lastMessage: data.type === "moment_image" ? "Исчезающее фото" : data.text,
                  timestamp: data.timestamp,
                  unread: String(data.senderId) === String(params.currentUserId) ? 0 : 1,
                },
                ...prev.chats,
              ],
            };
          }
          const updated = prev.chats.map((chat) =>
            String(chat.userId) === String(otherUserId)
              ? {
                  ...chat,
                  lastMessage: data.type === "moment_image" ? "Исчезающее фото" : data.text,
                  timestamp: data.timestamp,
                  unread:
                    String(data.senderId) === String(params.currentUserId)
                      ? chat.unread
                      : (chat.unread || 0) + 1,
                }
              : chat
          );
          return { chats: updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
        });

        if (String(data.receiverId) === String(params.currentUserId)) {
          wsService.sendMessageDelivered(data.id.toString());
        }
      }
    );

    const typingUnsub = wsService.on(
      "typing:update",
      (data: { chatId: string; isTyping: boolean; userId: string }) => {
        const isTyping = data.isTyping && String(data.userId) !== String(params.currentUserId);
        queryClient.setQueryData(
          messageQueryKeys.typing(String(data.chatId)),
          { isTyping, userId: String(data.userId) }
        );
        if (String(data.chatId) === String(params.selectedChatId)) {
          params.onTyping?.(isTyping);
        }
      }
    );

    const deletedUnsub = wsService.on(
      "message:deleted",
      (data: { scope: "all" | "me"; messageId: string; chatId?: string }) => {
        if (data.chatId) {
          const key = messageQueryKeys.chatMessages(String(data.chatId));
          queryClient.setQueryData<{ messages: Message[] }>(key, (prev) => {
            if (!prev?.messages) return prev;
            return { messages: prev.messages.filter((msg) => msg.id !== data.messageId) };
          });
          return;
        }

        queryClient.invalidateQueries({ queryKey: messageQueryKeys.chats() });
      }
    );

    const editedUnsub = wsService.on(
      "message_edited",
      (data: { messageId: string; chatId: string; text: string }) => {
        const key = messageQueryKeys.chatMessages(String(data.chatId));
        queryClient.setQueryData<{ messages: Message[] }>(key, (prev) => {
          if (!prev?.messages) return prev;
          return {
            messages: prev.messages.map((msg) =>
              msg.id === data.messageId ? { ...msg, text: data.text } : msg
            ),
          };
        });
      }
    );

    const presenceUnsub = wsService.on(
      "presence:update",
      (data: { userId: string; online: boolean; lastSeenAt?: string }) => {
        queryClient.setQueryData(
          messageQueryKeys.presence(String(data.userId)),
          { online: data.online, lastSeenAt: data.lastSeenAt ?? null }
        );
        if (String(data.userId) === String(params.selectedChatId)) {
          params.onPresence?.(data.online, data.lastSeenAt ?? null);
        }
      }
    );


    const readUnsub = wsService.on(
      "chat:read_update",
      (data: { chatId: string; userId: string; lastReadMessageId: string }) => {
        params.onReadReceipt?.(data);
      }
    );

    return () => {
      newMessageUnsub();
      typingUnsub();
      deletedUnsub();
      editedUnsub();
      presenceUnsub();
      readUnsub();
    };
  }, [
    params.currentUserId,
    params.selectedChatId,
    params.onTyping,
    params.onPresence,
    params.onReadReceipt,
    queryClient,
  ]);
};

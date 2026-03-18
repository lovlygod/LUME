import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesAPI } from "@/services/api";
import { messageSounds } from "@/services/messageSounds";
import type { Message, Chat } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";

export const useSendMessage = (currentUserId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      chatId: string;
      text?: string;
      attachmentIds?: string[];
      replyToMessageId?: string | null;
      stickerId?: string | null;
    }) => messagesAPI.sendMessage(payload),
    onSuccess: (data, variables) => {
      messageSounds.playSend();
      const now = new Date().toISOString();
      const chatKey = messageQueryKeys.chatMessages(variables.chatId);
      const chatsKey = messageQueryKeys.chatList();

      queryClient.setQueryData<{ messages: Message[] }>(chatKey, (prev) => {
        const list = prev?.messages || [];
        const optimistic: Message = {
          id: (data as { messageId?: string | number }).messageId?.toString() || `temp-${Date.now()}`,
          senderId: currentUserId ? String(currentUserId) : "self",
          sender: currentUserId
            ? {
                id: String(currentUserId),
                name: undefined,
                username: undefined,
                avatar: undefined,
                verified: false,
              }
            : null,
          text: variables.text || "",
          type: (data as { type?: Message["type"] }).type ?? (variables.stickerId ? "sticker" : "text"),
          sticker: (data as { sticker?: Message["sticker"] }).sticker ?? (variables.stickerId ? { id: variables.stickerId, url: "" } : null),
          timestamp: now,
          own: true,
          attachments: (data as { attachments?: Message["attachments"] }).attachments,
          replyToMessageId: (data as { replyToMessageId?: string | null }).replyToMessageId ?? variables.replyToMessageId ?? null,
          linkPreview: (data as { linkPreview?: Message["linkPreview"] }).linkPreview ?? null,
        };
        if (list.some((m) => m.id === optimistic.id)) return prev ?? { messages: list };
        return { messages: [...list, optimistic] };
      });

      queryClient.setQueryData<{ chats: Chat[] }>(chatsKey, (prev) => {
        if (!prev?.chats) return prev;
        const exists = prev.chats.find((chat) => String(chat.id) === String(variables.chatId));
        const lastMessage =
          variables.stickerId
            ? "[sticker]"
            : variables.text ||
              (variables.attachmentIds?.length
                ? `[${variables.attachmentIds.length} attachment]`
                : exists?.lastMessage || "");

        if (!exists) {
          const userData = queryClient.getQueryData<{ user: { id: string; name?: string; username?: string; avatar?: string; verified?: boolean } }>(
            messageQueryKeys.chatUser(variables.chatId)
          );
          const newChat: Chat = {
            id: `${Date.now()}`,
            type: "private",
            title: userData?.user?.name || userData?.user?.username,
            avatar: userData?.user?.avatar,
            lastMessage,
            timestamp: now,
            unread: 0,
          };
          return { chats: [newChat, ...prev.chats] };
        }

        const updated = prev.chats.map((chat) =>
          String(chat.id) === String(variables.chatId)
            ? {
                ...chat,
                lastMessage,
                timestamp: now,
              }
            : chat
        );
        return { chats: updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) };
      });
    },
  });
};

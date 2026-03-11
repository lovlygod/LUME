import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesAPI } from "@/services/api";
import type { Chat } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";

export const useMarkRead = (chatId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { lastReadMessageId: string }) =>
      messagesAPI.markAsRead(chatId as string, payload.lastReadMessageId),
    onSuccess: () => {
      queryClient.setQueryData<{ chats: Chat[] }>(messageQueryKeys.chatList(), (prev) => {
        if (!prev?.chats || !chatId) return prev;
        return {
          chats: prev.chats.map((chat) =>
            String(chat.userId) === String(chatId) ? { ...chat, unread: 0 } : chat
          ),
        };
      });
    },
  });
};

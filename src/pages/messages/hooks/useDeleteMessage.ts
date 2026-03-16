import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesAPI } from "@/services/api";
import type { Message } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";

export const useDeleteMessage = (chatId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { messageId: string; scope?: "me" | "all" }) =>
      messagesAPI.deleteMessage(payload.messageId, payload.scope ?? "me"),
    onError: (error, variables) => {
      console.error("[DeleteMessage] failed", {
        messageId: variables.messageId,
        scope: variables.scope ?? "me",
        error,
      });
    },
    onSuccess: (_data, variables) => {
      if (!chatId) return;
      const key = messageQueryKeys.chatMessages(chatId);
      queryClient.setQueryData<{ messages: Message[] }>(key, (prev) => {
        if (!prev?.messages) return prev;
        return {
          messages: prev.messages.filter((msg) => msg.id !== variables.messageId),
        };
      });
    },
  });
};

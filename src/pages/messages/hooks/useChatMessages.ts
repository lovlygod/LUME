import { useQuery } from "@tanstack/react-query";
import { messagesAPI } from "@/services/api";
import type { Message } from "@/types/messages";
import { messageQueryKeys } from "./queryKeys";

export const useChatMessages = (chatId: string | null) =>
  useQuery<{ messages: Message[] }>({
    queryKey: messageQueryKeys.chatMessages(chatId || ""),
    queryFn: () => messagesAPI.getMessages(chatId as string),
    enabled: Boolean(chatId),
  });
